class Announcement < ActiveRecord::Base
  attr_accessible :uuid, :title, :message_body, :created_by, :updated_by_id

  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :title

  default_scope where(deleted: false).order('created_at DESC')

  belongs_to :created_by, foreign_key: :created_by_id, class_name: 'User'
  belongs_to :updated_by, foreign_key: :updated_by_id, class_name: 'User'


  validates_presence_of :title, :message_body, :created_by_id



end
