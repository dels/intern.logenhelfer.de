class Announcement < ActiveRecord::Base

  include UuidHelper
  before_create :generate_uuid

  extend FriendlyId
  friendly_id :uuid

  default_scope { where(deleted: false).order('created_at DESC') }

  belongs_to :created_by, foreign_key: :created_by_id, class_name: 'User'
  belongs_to :updated_by, foreign_key: :updated_by_id, class_name: 'User'

  validates_presence_of :title, :message_body, :created_by_id

  after_create :notify_subscribers_new_announcement
  after_update :notify_subscribers_announcement_updated

  def notify_subscribers_new_announcement
    AnnouncementSubscription.all.each do |subscription|
      UserMailer.announcement_published_notification(self, subscription.user).deliver_later
    end
  end

  def notify_subscribers_announcement_updated
# XXX: do we really want this? 
#    AnnouncementSubscription.all.each do |subscription|
#      UserMailer.announcement_updated_notification(self, subscription.user).deliver_later
#    end
  end


end
