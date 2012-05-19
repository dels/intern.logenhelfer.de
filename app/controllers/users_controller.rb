class UsersController < AuthorizedController

  def index
  end

  def show
  end

  def new
  end

  def create
    if @user.save
      redirect_to @user, notice: t("activerecord.create_success", model: t("activerecord.models.user"))
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @user.update_attributes(params[:user])
      redirect_to @user, notice: t("activerecord.update_success", model: t("activerecord.models.user"))
    else
      render :edit
    end
  end

  def destroy
    @user.deleted = true
    @user.save
    redirect_to users_url, notice: t("activerecord.destroy_success", model: t("activerecord.models.user"))
  end
end
