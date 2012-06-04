class AttachedFilesController < ApplicationController
  before_filter :authenticate_user!
  check_authorization :except => :create
  load_and_authorize_resource :except => :create
  helper_method :sort_column, :sort_direction
  
  def download
    fd = FileDownload.new
    fd.user = current_user
    fd.attached_file = @attached_file
    fd.remote_ip = current_user.current_sign_in_ip
    fd.save!
    send_data @attached_file.content, :filename => @attached_file.filename, :type => @attached_file.content_type
  end
  
  def show
  end

  def new
    @attached_file.directory = Directory.find(params[:directory_id])
    @attached_file.role_ids = @attached_file.directory.role_ids
  end

  def create
    unless can?(:create, AttachedFile)
      redirect_to root_url, :alert => t("devise.error.access_denied")
    end
    @attached_file = AttachedFile.new do |af|
      file = params[:attached_file].delete(:file)
      af.filename = file.original_filename
      af.content_type = file.content_type
      af.content = file.tempfile.read
      file.tempfile.delete
      af.uploader_id = current_user.id
      af.directory_id = Directory.find(params[:directory_id]).id
      af.role_ids = params[:attached_file][:role_ids]
    end
    if @attached_file.save
      redirect_to [@attached_file.directory.category, @attached_file.directory], notice: t("activerecord.create_success", model: t("activerecord.models.attached_file"))
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @attached_file.update_attributes(params[:attached_file])
      redirect_to @attached_file.path_array, notice: t("activerecord.update_success", model: t("activerecord.models.attached_file"))
    else
      render :edit
    end
  end

  def destroy
    unless APP_CONFIG[:archive]
      @attached_file.deleted = true
    else
      @attached_file.deleted = false
    end
    @attached_file.save
    redirect_to [@attached_file.directory.category, @attached_file.directory], notice: t("activerecord.destroy_success", model: t("activerecord.models.attached_file"))
  end
end
