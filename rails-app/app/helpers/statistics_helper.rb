module StatisticsHelper

  def link_to_file_download file_download
    af = AttachedFile.where(id: file_download.attached_file_id).select('id, directory_id, uuid').first
    return nil unless af
    d  = Directory.where(id: af.directory_id).includes(:category).first

    image_link_tag_helper 'show', category_directory_attached_file_path(d.category, d, af), title: I18n.t('helpers.link.show')
  end

end
