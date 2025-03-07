class FileDownload < ApplicationRecord

  belongs_to :user, optional: true
  belongs_to :attached_file, optional: true

  default_scope { where(:deleted => false) }

end
