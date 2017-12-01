class District < ActiveRecord::Base
  extend FriendlyId
  friendly_id :name

  validates_presence_of :name
  
  has_many :lodges

  default_scope { where(:deleted => false) }
  default_scope { order('name ASC') }
end
