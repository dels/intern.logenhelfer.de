class User < ActiveRecord::Base
  devise :database_authenticatable, :recoverable, :rememberable, :trackable, 
         :validatable, :timeoutable

  attr_accessible :email, :password, :password_confirmation, :remember_me

  has_many :user_roles
  has_many :roles, :through => :user_roles

  def approved?
    true
  end

end
