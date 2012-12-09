class StatisticsController < AuthorizedController
  helper_method :sort_column, :sort_direction

  def index
  end

  # show last users activity and last login
  def user_stats
    @users = view_context.get_authorized_paginated(User.where("current_sign_in_at IS NOT NULL").order(sort_column(User.column_names, "current_sign_in_at DESC, sign_in_count") + " " + sort_direction)).page(params[:page])
  end

  # show all downlodas
  def downloads
    @file_downloads = FileDownload.order(sort_column(FileDownload.column_names + %w|2|, "created_at DESC, filename") + " " + sort_direction).page(params[:page])
  end

  # show how often each file has been downloaded
  def file_stats
    @file_downloads = FileDownload.select("filename, count(*), attached_file_id").order(sort_column(FileDownload.column_names + %w|2|, "2 DESC, filename") + " " + sort_direction).group(:filename, "file_downloads.attached_file_id ").page(params[:page])
  end

  # show
  def user_file_stats
    @users = view_context.get_authorized(User.joins(:file_downloads).select("distinct users.id, users.uuid, users.matriculation_number, users.firstname, users.lastname, count(*)").group("users.id, users.uuid, users.matriculation_number, users.firstname, users.lastname").order(sort_column(User.column_names + %w|6|, '6 DESC, lastname') + " " + sort_direction))
    
  end

private

  def sort_column columns = nil, default = nil
    return (columns).include?(params[:sort_by]) ? params[:sort_by] : default if(columns && default)
    # don't ask for the 2 and the 6 ... just leave it alone
    (User.column_names + FileDownload.column_names + %w|2 6|).include?(params[:sort_by]) ? params[:sort_by] : "1"
  end
end
