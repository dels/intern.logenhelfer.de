# -*- coding: utf-8 -*-
class User < ActiveRecord::Base
  include ActsAsAddressable
  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  devise :database_authenticatable, :recoverable, :rememberable, :trackable, 
         :validatable, :timeoutable#, :timeout_in => 1.hour

  attr_accessible :email, :password, :password_confirmation, :remember_me, :firstname, :lastname,
  :date_of_birth, :accepted_at, :role_id, :role_ids, :matriculation_number, :job_title, 
  :title, :entered_apprentice_since, :fellow_craft_since, :master_mason_since

  validates_presence_of :firstname, :lastname, :date_of_birth, :matriculation_number

  validates_uniqueness_of :matriculation_number

  has_many_addresses
  has_many :file_downloads
  has_many :user_roles
  has_many :roles, :through => :user_roles
  has_many :attached_files

#  has_many_addresses



  TITLES = {
    "Dipl. Ing."                 => 1,
    "Dipl. Kfm."                 => 10,
    "Dipl. Ing."                 => 20,
    "Dipl. Ökonom"               => 30,
    "Dipl. Bankbetriebswirt"     => 40,
    "Dipl.-Betr.Wirt"            => 50,
    "Dr."                        => 60,
    "Dr-Ing."                    => 70,
    "Prof. Dipl.-Ing."           => 80,
    "Prof. Dr."                  => 90,
    "Prof. Dr-Ing."              => 100
  }

  def title_str
    @title ||= (r = TITLES.rassoc(self.title)) ? r[0] : nil
  end

  def approved?
    true
  end

  def fullname
    "#{title_str || ''} #{firstname} #{lastname}"
  end

  def num_degree
    degree = 1
    degree += 1 if(self.roles.include? Role.find_by_name("FellowCraft"))
    degree += 1 if(self.roles.include? Role.find_by_name("MasterMason"))
    degree
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
    ur = self.user_roles.where(:role_id => Role.find_by_name('EnteredApprentice')).first
    ur = UserRole.new unless ur
    ur.role = Role.find_by_name('EnteredApprentice')
    ur.user = self
    ur.role_added_at = date
    ur.save!
  end
  
  def fellow_craft_since=(date)
    return if date.blank?
    ur = self.user_roles.where(:role_id => Role.find_by_name('FellowCraft')).first
    ur = UserRole.new unless ur
    ur.role = Role.find_by_name('FellowCraft')
    ur.user = self
    ur.role_added_at = date
    ur.save!
  end

  def master_mason_since=(date)
    return if date.blank?
    ur = self.user_roles.where(:role_id => Role.find_by_name('MasterMason')).first
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
    self.user_roles & Role.degrees
  end

  def positions
    self.user_roles & Role.positions
  end
  
  def self.get_secretary
    secretary_user_role = Role.find_by_name("Secretary").user_roles.first
    secretary_user_role.user if secretary_user_role
  end

  alias to_s fullname

end
