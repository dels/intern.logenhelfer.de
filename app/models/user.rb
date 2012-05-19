class User < ActiveRecord::Base
  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  devise :database_authenticatable, :recoverable, :rememberable, :trackable, 
         :validatable, :timeoutable

  attr_accessible :email, :password, :password_confirmation, :remember_me, :firstname, :lastname,
                  :date_of_birth, :included_at, :accepted_at

  validates_presence_of :firstname, :lastname

  has_many :user_roles
  has_many :roles, :through => :user_roles
  has_many :attached_files

  def approved?
    true
  end

  def fullname
    "#{firstname} #{lastname}"
  end

end
