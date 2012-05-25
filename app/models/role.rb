class Role < ActiveRecord::Base
  attr_accessible :description, :name, :display_name

  validates_presence_of :name, :display_name

  has_many :user_roles

  has_many :category_roles
  has_many :categories, :through => :category_roles

  def self.positions
    Role.all - Role.where(:name => ['EnteredApprentice', 'FellowCraft', 'MasterMason'])
  end
  
  def self.degrees
    Role.all & Role.where(:name => ['EnteredApprentice', 'FellowCraft', 'MasterMason'])
  end

  def self.degree_ids
    nums = []
    degrees.each do |n|
      nums << n
    end
    nums
  end

  def self.position_ids
    nums = []
    positions.each do |n|
      nums << n
    end
    nums
  end

  def to_s
    "#{display_name}"
  end
end
