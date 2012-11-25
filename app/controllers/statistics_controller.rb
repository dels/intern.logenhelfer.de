class StatisticsController < AuthorizedController
  helper_method :sort_column, :sort_direction

  def index
  end

  # show last users activity and last login
  def user_stats
    @users = User.where("last_sign_in_at IS NOT NULL").order(sort_column + " " + sort_direction).page(params[:page])
  end

  # show all downlodas
  def downloads
    @file_downloads = FileDownload.page(params[:page])
  end

  # show how often each file has been downloaded
  def file_stats
    @file_downloads = FileDownload.select("filename, count(*), attached_file_id").order("2 DESC").group(:filename, "file_downloads.attached_file_id ").page(params[:page])
  end

  # show
  def user_file_stats
    @users = User.all(:select=> "distinct users.id, users.uuid, users.matriculation_number, users.firstname, users.lastname, count(*)", :joins => :file_downloads, :group => "users.id, users.uuid, users.matriculation_number, users.firstname, users.lastname", :order => "count DESC")
  end

private

  def sort_column
    (User.column_names).include?(params[:sort_by]) ? params[:sort_by] : "last_sign_in_at DESC, sign_in_count"
  end


end
