# -*- coding: utf-8 -*-
class User < ApplicationRecord
  include ActsAsAddressable
  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  devise :database_authenticatable, :recoverable, :rememberable, :trackable,
      :validatable, :timeoutable#, timeout_in: 1.hour

  attr_accessor :google_edit_url, :google_self_url
  
  validates_presence_of :firstname, :lastname, :date_of_birth, :matriculation_number
  # FIXME: should be before create and we should have a uniqueness of clause here
  validate :validate_matriculation_number
  validate :validate_addresses
  validate :validate_degrees
  validate :validate_roles, :on => :update
  validate :validate_mother_lodge_accepted_at_combi

  has_many_addresses
  has_many :file_downloads
  has_many :user_roles
  has_many :roles, through: :user_roles#, :uniq => true
  has_many :attached_files
  has_many :announcement_subscription
  has_many :external_event_participants
  has_many :external_events, :through => :external_event_participants
  belongs_to :academic_title, optional: true

  default_scope { includes(:academic_title) }
  scope :undeleted, -> { where(deleted: false) }
  scope :search, ->(param) {
    where([
        'email ILIKE :param',
        'firstname ILIKE :param',
        'lastname ILIKE :param',
        'matriculation_number::text ILIKE :param'
    ].join(' OR '), param: "%#{param}%" )
  }

  def self.from_omniauth(user, auth)
    user.provider = auth.provider
    user.g_uid = auth.uid
    user.g_name = auth.info.name
    user.g_mail = auth.info.email
    user.oauth_token = auth.credentials.token
    user.oauth_expires_at = Time.at(auth.credentials.expires_at)
    user.save!
    user
  end

  def approved?
    true
  end

  def reverse_fullname
    "#{lastname}, #{firstname}"
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

  def phone
    if private_address
      return private_address.mobile unless private_address.mobile.empty?
      return private_address.phone unless private_address.phone.empty?
    end
    if business_address
      return business_address.mobile unless business_address.mobile.empty?
      return business_address.phone unless business_address.phone.empty?
    end
    Rails.logger.warn("did not find any phone number for #{fullname}")
    ""
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

  def set_degree_by_name(role, date)
    return if date.blank?
    return unless self.id
    ur = self.user_roles.where(user_id: self.id).where(role_id: Role.find_by_name(role)).first
    ur = UserRole.new unless ur
    ur.role_id = Role.find_by_name(role).id
    ur.user_id = self.id
    ur.role_added_at = date
    ur.save!
  end
  
  def entered_apprentice_since=(date)
    set_degree_by_name("EnteredApprentice", date)
  end

  def fellow_craft_since=(date)
    unless entered_apprentice_since
      errors.add(:base, I18n.t("activerecord.errors.must_be_fellow_craft_to_become_master"))
      return
    end
    set_degree_by_name("FellowCraft", date)
  end

  def master_mason_since=(date)
    unless fellow_craft_since
      errors.add(:base, I18n.t("activerecord.errors.must_be_fellow_craft_to_become_master"))
      return
    end
    set_degree_by_name("MasterMason", date)
  end

  def rome_degree
    "I" * num_degree
  end

  def degrees
    self.roles & Role.degrees
  end

  def positions
    # FIXME: only self.roles & Role.positions should be required here
    self.roles & Role.positions - (Role.where(:administrational_role => true))
  end

  def administrational_roles
    # FIXME: only self.roles & Role.administrational_roles should be required here
    self.roles & Role.positions - (Role.where(:administrational_role => false))
  end

  def self.members_of_council
    User.undeleted.joins(:roles).where("roles.name = 'MemberOfCouncil'", :order => 'roles.ordering_number ASC, roles.display_name ASC, users.lastname')
  end

  def positions_email_adresses
    self.roles.map { |r| 
      nil unless r.email
      r.email
    }.compact.join("\n")
  end

  def self.secretary
    secretary_user_role = Role.find_by_name("Secretary").user_roles.first
    secretary_user_role.user if secretary_user_role
  end

  def self.admin
    admin_user_role = Role.find_by_name("Admin").user_roles.first
    admin_user_role.user if admin_user_role
  end

  def self.worshipful_master
    # FIXME: should we return nil if we didn't find a worshipful master?
    whorshipful_master_user_role = Role.find_by_name("WorshipfulMaster").user_roles.first
    whorshipful_master_user_role.user if whorshipful_master_user_role
  end

  def admin?
    roles.include?(Role.find_by_name("Admin"))
  end

  def secretary?
    roles.include?(Role.find_by_name("Secretary"))
  end

  def worshipful_master?
    roles.include?(Role.find_by_name("WorshipfulMaster"))
  end

  def net_delegate?
    roles.include?(Role.find_by_name("NetDelegate"))
  end

  def user_admin?
    return true if secretary? || admin?
    return true if roles.include?(Role.find_by_name("UserAdmin"))
    false
  end

  def app_responsible?
    return true if admin? or secretary? or worshipful_master? or net_delegate?
    false
  end

  def validate_matriculation_number
    doubles = User.where(matriculation_number: matriculation_number)
    if doubles && self.id
      doubles = doubles.where("id != #{self.id}")
    end
    unless doubles.empty?
      Rails.logger.debug("found entry with m nr #{matriculation_number} (#{doubles.first.fullname})")
      self.matriculation_number = User.maximum(:matriculation_number) + 1
      Rails.logger.debug("set m nr to #{self.matriculation_number} for #{fullname}")
    end
  end
  
  def validate_degrees
    if fellow_craft_since && entered_apprentice_since.nil?
      errors.add(:base, I18n.t("activerecord.errors.must_be_entered_apprentice_to_become_fellow_craft"))
    end
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
    # check if user is at least entered apprentice
    if entered_apprentice_since.nil? || entered_apprentice_since.blank?
      errors.add(:base, I18n.t("activerecord.errors.must_be_entered_apprentice"))
    end
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
        strs << "#{addr.purpose}:\n#{addr.phone}"
      end
    end
    strs.join("\n")
  end

  def fax_numbers_printable
    strs = []
    addresses.each do |addr|
      if addr.fax.present?
        strs << "#{addr.purpose}:\n#{addr.fax}"
      end
    end
    strs.join("\n")
  end

  def mobile_numbers_printable
    strs = []
    addresses.each do |addr|
      if addr.mobile.present?
        strs << "#{addr.purpose}:\n#{addr.mobile}"
      end
    end
    strs.join("\n")
  end

  def age
    now = Time.now.utc.to_date
    now.year - date_of_birth.year - ((now.month > date_of_birth.month || (now.month == date_of_birth.month && now.day >= date_of_birth.day)) ? 0 : 1)
  end

  def twentyfifth_jubilee
    return nil unless entered_apprentice_since
    entered_apprentice_since + 25.years
  end

  def fortieth_jubilee
    return nil unless entered_apprentice_since
    entered_apprentice_since + 40.years
  end

  def subscribed_to_news
    (false == AnnouncementSubscription.where(:user_id => self.id).empty?)
  end

  def subscribe_to_news
    AnnouncementSubscription.create(:user_id => self.id) unless subscribed_to_news
  end

  def active_for_authentication?
    super && !deleted?
  end

  def self.count_all
    User.undeleted.count
  end

  def subscribed_to_event?(event)
    ExternalEvent.where(user_id: self.id).where(id: event.id)
  end
  
  def subscribed_to_external_event?(event)
    ExternalEvent.where(user_id: self.id).where(id: event.id)
  end
  
  def subscription_status(event)
    p = nil
    p = case event.class.to_s
    when Event.to_s
      p = EventParticipant.where(:user_id => self.id).where(:event_id => event.id)
    when ExternalEvent.to_s
      p = ExternalEventParticipant.where(:user_id => self.id).where(:external_event_id => event.id)
    else
      Rails.logger.error("unhandeled class: #{event.class}")
      return I18n.t("text.external_event_subscription.not_subscribed")
    end
    return I18n.t("text.external_event_subscription.not_subscribed") if p.empty?
    p = p.first
    if p.subscription_confirmed?
      return I18n.t("text.external_event_subscription.subscription_to_work_confirmed") unless p.festive_board
      return I18n.t("text.external_event_subscription.subscription_to_work_and_festive_board_confirmed")
    end
    return I18n.t("text.external_event_subscription.to_be_subscribed_to_work") unless p.festive_board
    return I18n.t("text.external_event_subscription.to_be_subscribed_to_work_and_festive_board") 
  end

  def accept_gdpr!
    self.accepted_gdpr = true
    Rails.logger.info("#{fullname} has accepted GDPR.")
    
    self.save
  end
  
  alias to_s fullname

end

