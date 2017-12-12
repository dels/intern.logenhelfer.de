class ApplicationController < ActionController::Base
  layout :simplistic
  protect_from_forgery
  helper :layout
  helper_method :current_google_user

  #helper_method :get_safe_date, :get_safe_start_end_date

  before_action :filter_empty_passwords_and_user_type, only: [:create, :update]

  before_action do
    resource = controller_name.singularize.to_sym
    method = "#{resource}_params"
    params[resource] &&= send(method) if respond_to?(method, true)
  end
  
  rescue_from CanCan::AccessDenied do |exception|
    UserMailer.access_denied_notification(current_user, exception.action.to_s, exception.subject.inspect, request.url).deliver_later
    logger.debug "Access denied on #{exception.action} #{exception.subject.inspect}"
    redirect_to login_url, alert: t("devise.error.access_denied")
  end
  
  def current_google_user
    @current_google_user ||= User.find(session[:google_user_id]) if session[:google_user_id]
    return nil unless @current_google_user
    return nil if @current_google_user.oauth_expires_at <= Time.now
    @current_google_user
  end

  def after_sign_in_path_for(resource)
    login_path
  end

  protected

  def simplistic
    begin
      if user_signed_in?
        'application'
      else
        'simplistic'
      end
    rescue
      current_user.sign_out
    end
  end

  def sort_direction
    %w[asc desc].include?(params[:direction]) ? params[:direction] : 'asc'
  end

  def filter_empty_passwords_and_user_type
    return if ['google_sessions', 'sessions', 'confirmations', 'passwords', 'app_config'].include?(controller_name)
    res = self.class.name.gsub(/Controller$/, '').singularize.constantize
    sym = controller_name.singularize.to_sym
    return unless params[sym].present?

    if params[:user].present?
      params[sym].delete(:password)                                 if params[sym][:password].blank?
      params[sym].delete(:password_confirmation)                    if params[sym][:password_confirmation].blank?
    elsif params[sym][:user_attributes].present?
      params[sym][:user_attributes].delete(:password)               if params[sym][:user_attributes][:password].blank?
      params[sym][:user_attributes].delete(:password_confirmation)  if params[sym][:user_attributes][:password_confirmation].blank?
    end
  end



  # FIXME: refactor PDF generator into seperate class

  def create_pdf_with_header
    top_margin            = 40
    spacing_below_header  = 10
    header_height         = 160 + spacing_below_header
    pdf = Prawn::Document.new(
      page_size: 'A4',
      page_layout: :portrait,
      top_margin: top_margin + header_height
    )
    pdf.repeat :all do
      img = pdf.image Rails.root.join('app/assets/images/pdf_header.png').to_s,
          at: [0, pdf.bounds.absolute_top + header_height],
          width: pdf.bounds.width
    end
    pdf
  end

  def add_pdf_title(title, pdf)
    pdf.text title, align: :center, size: 18
  end

  def add_pdf_section(title, pdf)
    pdf.move_down 10
    pdf.text title, style: :bold, size: 14
    pdf.outline.section title, destination: pdf.page_number
  end

  def add_pdf_html(html, pdf)
    pdf.text(html, :inline_format => true)
  end

  def get_pdf_list(headings, values, options = {}, cell_style = {}, pdf = nil)
    pdf ||= Prawn::Document.new(page_size: 'A4', page_layout: :landscape)
    arr = []
    # defining cell headlines
    arr << headings
    # adding table
    arr.concat values.map{|row| row.map{|col| col.to_s.strip}}
    pdf.table(arr, { header: true, row_colors: [ 'FFFFFF', 'DDDDDD' ], cell_style: { size: 12 }.merge(cell_style) }.merge(options)) do
      row(0).border_width = 2
      row(0).font_style = :bold
      row(0).size = 12
      yield if block_given?
    end
    pdf
  end

end
