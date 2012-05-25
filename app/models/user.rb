# -*- coding: utf-8 -*-
class User < ActiveRecord::Base
  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  devise :database_authenticatable, :recoverable, :rememberable, :trackable, 
         :validatable, :timeoutable

  attr_accessible :email, :password, :password_confirmation, :remember_me, :firstname, :lastname,
  :date_of_birth, :included_at, :accepted_at, :role_id, :role_ids, :matriculation_number, :job_title, 
  :title

  validates_presence_of :firstname, :lastname, :date_of_birth, :included_at

  has_many :file_downloads
  has_many :user_roles
  has_many :roles, :through => :user_roles
  has_many :attached_files

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

  def rome_degree
    "I" * num_degree
  end

  def fullname_with_title

  end
  
  alias to_s fullname

end
