class AttachedFilesController < ApplicationController
  load_and_authorize_resource

  def index
  end

  def show
  end

  def new
  end

  def create
    if @attached_file.save
      redirect_to @attached_file, notice: t("activerecord.create_success", model: t("activerecord.models.attached_file"))
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @attached_file.update_attributes(params[:attached_file])
      redirect_to @attached_file, notice: t("activerecord.update_success", model: t("activerecord.models.attached_file"))
    else
      render :edit
    end
  end

  def destroy
    @attached_file.deleted = true
    @attached_file.save
    redirect_to attached_files_url, notice: t("activerecord.destroy_success", model: t("activerecord.models.attached_file"))
  end
end
