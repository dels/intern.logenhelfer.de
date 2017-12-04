class District < ActiveRecord::Base
  extend FriendlyId
  friendly_id :name

  validates_presence_of :name
  
  has_many :lodges

  default_scope { where(:deleted => false) }
  default_scope { order('name ASC') }

  after_save do |district|
    next unless deleted
    self.lodges.each do |lodge|
      Rails.logger.debug("deleting lodge #{lodge.name}")
      lodge.deleted = true
      lodge.save!
    end    
  end

end
