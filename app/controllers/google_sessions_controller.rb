class GoogleSessionsController < AuthorizedController

  skip_authorization_check
  
  def create
    user = User.from_omniauth(current_user, request.env["omniauth.auth"])
    session[:google_user_id] = user.id
    redirect_to google_sync_users_path
  end

  def destroy
    session[:google_user_id] = nil
    redirect_to google_sync_users_path
  end
end
