class Lodge < ActiveRecord::Base
  extend FriendlyId
  friendly_id :name, use: :slugged

  attr_accessible :slug, :name, :description, :district_id

  validates_presence_of :name, :district_id

  belongs_to :district

  has_many :officers

  default_scope where(:deleted => false)
end
