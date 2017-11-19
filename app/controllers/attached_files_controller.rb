class AttachedFilesController < ApplicationController
  before_filter :authenticate_user!
  check_authorization :except => :create
  helper_method :sort_column, :sort_direction
  load_and_authorize_resource except: [:create], :find_by => :uuid
  
  def download
    fd = FileDownload.new
    fd.user = current_user
    fd.attached_file = @attached_file
    fd.filename = @attached_file.filename
    fd.remote_ip = current_user.current_sign_in_ip
    fd.save!
    send_data @attached_file.content, :filename => @attached_file.filename, :type => @attached_file.content_type
  end

  def show
  end

  def new
    @attached_file.directory = Directory.find_by_slug(params[:directory_id])
    @attached_file.role_ids = @attached_file.directory.role_ids
  end

  def create
    # important as we skip load_and_authorze_resource
    unless can?(:create, AttachedFile)
      redirect_to root_url, :alert => t("devise.error.access_denied")
    end
    file = params[:attached_file].delete(:file)
    if file.present?
      @attached_file = AttachedFile.new do |af|
        af.filename     = file.original_filename
        af.content_type = file.content_type
        af.content      = file.tempfile.read
        file.tempfile.delete
        af.uploader_id  = current_user.id
        af.directory_id = Directory.find_by_slug(params[:directory_id]).id
        af.role_ids     = params[:attached_file][:role_ids]
      end
      @attached_file.content_length = @attached_file.content.length
      @attached_file.filename = params[:attached_file][:filename] unless params[:attached_file][:filename].empty? 
      if @attached_file.save
        redirect_to [@attached_file.directory.category, @attached_file.directory], notice: t("activerecord.create_success", model: t("activerecord.models.attached_file"))
      else
        render :new
      end
    else
      @attached_file = AttachedFile.new do |af|
        af.directory = Directory.find_by_slug(params[:directory_id])
        af.role_ids = params[:attached_file][:role_ids]
      end
      flash.now[:error] = t('activerecord.upload_failure')
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
    unless AppConfig[:archive]
      @attached_file.deleted = true
    else
      @attached_file.deleted = false
    end
    @attached_file.save
    redirect_to [@attached_file.directory.category, @attached_file.directory], notice: t("activerecord.destroy_success", model: t("activerecord.models.attached_file"))
  end

  private

  def attached_file_params
    params.require(:attached_file).permit(:file,
                                          :filename,
                                          :content,
                                          :content_type,
                                          :directory_id,
                                          {role_ids: [] }
                                         )
  end
  
end
