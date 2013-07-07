class AnnouncementsController < AuthorizedController

  def index
  end

  def show
  end

  def new
  end

  def create
    @announcement.created_by = current_user
    if @announcement.save
      redirect_to @announcement, notice: t("activerecord.create_success", model: t("activerecord.models.announcement"))
    else
      render :new
    end
  end

  def edit
  end

  def update
    @announcement.updated_by = current_user
    if @announcement.update_attributes(params[:announcement])
      redirect_to @announcement, notice: t("activerecord.update_success", model: t("activerecord.models.announcement"))
    else
      render :edit
    end
  end

  def destroy
    @announcement.deleted = true
    @announcement.save
    redirect_to announcements_url, notice: t("activerecord.destroy_success", model: t("activerecord.models.announcement"))
  end
end
