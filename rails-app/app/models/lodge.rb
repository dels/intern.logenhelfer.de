class Lodge < ApplicationRecord
  extend FriendlyId
  friendly_id :name, use: :slugged

  validates_presence_of :name, :district_id

  belongs_to :district

  has_many :officers

  default_scope { where(:deleted => false) }

  after_save do |lodge|
    next unless deleted
    officers.each do |officer|
      Rails.logger.debug("deleting officer #{officer.fullname}")
      officer.deleted = true
      officer.save
    end
  end

end
