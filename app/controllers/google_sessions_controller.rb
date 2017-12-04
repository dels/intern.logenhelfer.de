class GoogleSessionsController < AuthorizedController
  
  def create
    user = User.from_omniauth(current_user, env["omniauth.auth"])
    session[:google_user_id] = user.id
    redirect_to google_sync_users_path
  end

  def destroy
    session[:google_user_id] = nil
    redirect_to google_sync_users_path
  end
end
