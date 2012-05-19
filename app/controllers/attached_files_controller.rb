class AttachedFilesController < ApplicationController
  before_filter :authenticate_user!
  check_authorization :except => :create
  load_and_authorize_resource :except => :create
  
  def show
  end

  def new
  end

  def create
    unless current_user.role_ids.include?(Role.find_by_name("Uploader").id)
      redirect_to root_url, :alert => t("devise.error.access_denied")
    end
    @attached_file = AttachedFile.new do |af|
      file = params[:attached_file].delete(:file)
      af.filename = file.original_filename
      af.content_type = file.content_type
      af.content = file.tempfile.read
      file.tempfile.delete
      af.uploader_id = current_user.id
    end
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
