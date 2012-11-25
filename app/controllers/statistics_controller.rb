class StatisticsController < AuthorizedController
  helper_method :sort_column, :sort_direction

  def user_stats
    @users = User.where("last_sign_in_at IS NOT NULL").order("last_sign_in_at DESC")
  end

private
  
  def sort_column
    (User.column_names).include?(params[:sort_by]) ? params[:sort_by] : "lastname ASC, firstname ASC, email "
  end


end
