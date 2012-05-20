class User < ActiveRecord::Base
  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  devise :database_authenticatable, :recoverable, :rememberable, :trackable, 
         :validatable, :timeoutable

  attr_accessible :email, :password, :password_confirmation, :remember_me, :firstname, :lastname,
                  :date_of_birth, :included_at, :accepted_at, :role_id, :role_ids

  validates_presence_of :firstname, :lastname, :date_of_birth, :included_at

  has_many :file_downloads
  has_many :user_roles
  has_many :roles, :through => :user_roles
  has_many :attached_files

  def approved?
    true
  end

  def fullname
    "#{firstname} #{lastname}"
  end

  def num_degree
    degree = 1
    degree += 1 if(self.roles.include? Role.find_by_name("FellowCraft"))
    degree += 1 if(self.roles.include? Role.find_by_name("MasterMason"))
    degree
  end

end
