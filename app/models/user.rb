class User < ActiveRecord::Base
  include ActsAsAddressable
  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  devise :database_authenticatable, :recoverable, :rememberable, :trackable,
      :validatable, :timeoutable#, timeout_in: 1.hour

  attr_accessible :email, :password, :password_confirmation, :remember_me,
      :firstname, :lastname, :date_of_birth, :academic_title_id,
      :accepted_at, :mother_lodge, :role_id, :role_ids, :matriculation_number, :job_title,
      :entered_apprentice_since, :fellow_craft_since, :master_mason_since

  validates_presence_of :firstname, :lastname, :date_of_birth, :matriculation_number
  validates_uniqueness_of :matriculation_number
  validate :validate_addresses
  validate :validate_degrees
  validate :validate_roles   
  validate :validate_mother_lodge_accepted_at_combi

  has_many_addresses
  has_many :file_downloads
  has_many :user_roles
  has_many :roles, through: :user_roles
  has_many :attached_files
  belongs_to :academic_title

  default_scope includes(:academic_title)
  scope :undeleted, where(deleted: false)
  scope :search, ->(param) {
    where([
        'email ILIKE :param',
        'firstname ILIKE :param',
        'lastname ILIKE :param',
        'matriculation_number::text ILIKE :param'
    ].join(' OR '), param: "%#{param}%" )
  }

  def approved?
    true
  end

  def fullname
    [ firstname, lastname ].compact.join(' ')
  end

  def fullname_with_title
    [ academic_title, firstname, lastname ].compact.join(' ')
  end

  def num_degree
    degree = 1
    degree += 1 if(self.roles.include? Role.find_by_name("FellowCraft"))
    degree += 1 if(self.roles.include? Role.find_by_name("MasterMason"))
    degree
  end

  def business_address
    addresses.where(type_of_address: Address::TYPES[:business]).first
  end

  def private_address
    addresses.where(type_of_address: Address::TYPES[:private]).first
  end

  def other_addresses
    addresses.where(type_of_address: Address::TYPES[:other])
  end

  def entered_apprentice_since
    unless roles.find_by_name('EnteredApprentice')
      Rails.logger.fatal("#{self.fullname} is no entered apprentice")
      return nil
    end
    user_roles.find_by_role_id(roles.find_by_name('EnteredApprentice').id).role_added_at
  end

  def fellow_craft_since
    return nil unless roles.find_by_name('FellowCraft')
    user_roles.find_by_role_id(roles.find_by_name('FellowCraft').id).role_added_at
  end

  def master_mason_since
    return nil unless roles.find_by_name('MasterMason')
    user_roles.find_by_role_id(roles.find_by_name('MasterMason').id).role_added_at
  end

  def entered_apprentice_since=(date)
    return if date.blank?
    ur = self.user_roles.where(role_id: Role.find_by_name('EnteredApprentice')).first
    ur = UserRole.new unless ur
    ur.role = Role.find_by_name('EnteredApprentice')
    ur.user = self
    ur.role_added_at = date
    ur.save!
  end

  def fellow_craft_since=(date)
    return if date.blank?
    ur = self.user_roles.where(role_id: Role.find_by_name('FellowCraft')).first
    ur = UserRole.new unless ur
    ur.role = Role.find_by_name('FellowCraft')
    ur.user = self
    ur.role_added_at = date
    ur.save!
  end

  def master_mason_since=(date)
    return if date.blank?
    ur = self.user_roles.where(role_id: Role.find_by_name('MasterMason')).first
    ur = UserRole.new unless ur
    ur.role = Role.find_by_name('MasterMason')
    ur.user = self
    ur.role_added_at = date
    ur.save!
  end

  def rome_degree
    "I" * num_degree
  end

  def degrees
    self.roles & Role.degrees
  end

  def positions
    self.roles & Role.positions - (Role.where(name: ['Admin', 'FileAdmin']))
  end

  def self.get_secretary
    secretary_user_role = Role.find_by_name("Secretary").user_roles.first
    secretary_user_role.user if secretary_user_role
  end

  alias to_s fullname

  def validate_degrees
    if master_mason_since && fellow_craft_since.nil?
      errors.add(:base, I18n.t("activerecord.errors.must_be_fellow_craft_to_become_master"))
    end
  end

  def validate_addresses
    if(1 < (addresses.to_a.select{|addr| 0 == addr.type_of_address }).count)
      errors.add(:base, I18n.t("activerecord.errors.maximum_private_addresses_exceeded"))
    end
    if(1 < (addresses.to_a.select{|addr| 1 == addr.type_of_address }).count)
      errors.add(:base, I18n.t("activerecord.errors.maximum_business_addresses_exceeded"))
    end
  end

  def validate_roles
    # TODO: only a master mason can have additional roles, such as whorshipful master or secretary
  end

  def validate_mother_lodge_accepted_at_combi
    return if (mother_lodge.blank? and accepted_at.blank?) or (false == mother_lodge.blank? and false == accepted_at.blank?)
    errors.add(:base, I18n.t("activerecord.errors.mother_lodge_and_accepted_at"))
  end

  # quick fix from https://github.com/railslove/birthday/blob/master/lib/railslove/acts/birthday/adapter/postgresql_adapter.rb#L7
  # TODO: use Postgres' AGE() function
  scope :upcoming_birthdays, ->(from,to) {
    from = from.to_date

    if ((to.respond_to?(:empty?) && to.empty?) || !to)
      where_sql = "to_char(\"date_of_birth\", 'MMDD') = '#{from.strftime('%m%d')}'"
    else
      to = to.to_date
      if to.strftime('%m%d') < from.strftime('%m%d')
        where_sql = [
          "to_char(\"date_of_birth\", 'MMDD') BETWEEN '0101' AND '#{to.strftime('%m%d')}'",
          "to_char(\"date_of_birth\", 'MMDD') BETWEEN '#{from.strftime('%m%d')}' AND '1231'"
        ].join(' OR ')
      else
        where_sql = "to_char(\"date_of_birth\", 'MMDD') BETWEEN '#{from.strftime('%m%d')}' AND '#{to.strftime('%m%d')}'"
      end
    end
    where_sql += " AND deleted = 'f'"
    where(where_sql)
  }

  def self.upcoming_birthday_events(start_date, end_date)
    upcoming_birthdays(start_date, end_date).map {|user|
      Event.new.tap {|e|
        e.date      = user.date_of_birth.change(year: start_date.year)
        e.title     = "#{Event.human_attribute_name('type/birthday')}: #{user.fullname}"
        e.whole_day = true
        e.target    = user
        e.birthday!
      }
    }
  end

  def phone_numbers_printable
    strs = []
    addresses.each do |addr|
      if addr.phone.present?
        strs << "#{addr.purpose}: #{addr.phone}"
      end
    end
    strs.join("\n")
  end

  def fax_numbers_printable
    strs = []
    addresses.each do |addr|
      if addr.fax.present?
        strs << "#{addr.purpose}: #{addr.fax}"
      end
    end
    strs.join("\n")
  end

  def mobile_numbers_printable
    strs = []
    addresses.each do |addr|
      if addr.mobile.present?
        strs << "#{addr.purpose}: #{addr.mobile}"
      end
    end
    strs.join("\n")
  end

  def age
    now = Time.now.utc.to_date
    now.year - date_of_birth.year - ((now.month > date_of_birth.month || (now.month == date_of_birth.month && now.day >= date_of_birth.day)) ? 0 : 1)
  end

  def active_for_authentication?
    super && !deleted?
  end

  def self.count_all
    User.undeleted.count
  end

end
