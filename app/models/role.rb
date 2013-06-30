class Role < ActiveRecord::Base
  attr_accessible :email

  validates_presence_of :name, :display_name

  has_many :user_roles, dependent: :destroy
  has_many :users, through: :user_roles, dependent: :destroy

  has_many :category_roles
  has_many :categories, through: :category_roles, dependent: :destroy

  def self.positions
    # XXX: Role.where('name NOT IN (*)', ['EnteredApprentice', 'FellowCraft', 'MasterMason'])
    # XXX: scope :positions, where(...)
    Role.all - Role.where(name: ['EnteredApprentice', 'FellowCraft', 'MasterMason'])
  end

  def self.degrees
    # XXX: Role.where(name: ['EnteredApprentice', 'FellowCraft', 'MasterMason'])
    # XXX: scope :degrees, where(...)
    Role.all & Role.where(name: ['EnteredApprentice', 'FellowCraft', 'MasterMason'])
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
    display_name
  end

  def is_group?
    group?
  end

end
