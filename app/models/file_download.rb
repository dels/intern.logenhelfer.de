class FileDownload < ActiveRecord::Base
  attr_accessible :attached_file_id, :user_id, :remote_ip

  belongs_to :user
  belongs_to :attached_file

  default_scope where(:deleted => false)

end
