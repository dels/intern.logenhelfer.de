class FileDownloadsController < ApplicationController
  load_and_authorize_resource

  def index
    @file_downloads = @file_downloads.page(params[:page])
  end

  def show
  end

  def new
  end

  def create
    if @file_download.save
      redirect_to @file_download, notice: t("activerecord.create_success", model: t("activerecord.models.file_download"))
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @file_download.update_attributes(params[:file_download])
      redirect_to @file_download, notice: t("activerecord.update_success", model: t("activerecord.models.file_download"))
    else
      render :edit
    end
  end

  def destroy
    @file_download.deleted = true
    @file_download.save
    redirect_to file_downloads_url, notice: t("activerecord.destroy_success", model: t("activerecord.models.file_download"))
  end
end
