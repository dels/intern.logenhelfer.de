class FileDownload < ActiveRecord::Base

  belongs_to :user
  belongs_to :attached_file

  default_scope { where(:deleted => false) }

end
