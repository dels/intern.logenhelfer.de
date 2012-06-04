class ApplicationController < ActionController::Base
  layout :simplistic
  protect_from_forgery
  helper :layout

  #helper_method :get_safe_date, :get_safe_start_end_date

  before_filter :filter_empty_passwords_and_user_type, :only => [:create, :update]

  rescue_from CanCan::AccessDenied do |exception|
    logger.debug "Access denied on #{exception.action} #{exception.subject.inspect}"
    exception.backtrace.each do |line|
      logger.debug "\t#{line}"
    end
    redirect_to root_url, :alert => t("devise.error.access_denied")
  end

protected

  def simplistic
    if user_signed_in?
      'application'
    else
      'simplistic'
    end
  end

  def sort_direction
    %w[asc desc].include?(params[:direction]) ? params[:direction] : 'asc'
  end

  def filter_empty_passwords_and_user_type
    return if ['sessions', 'confirmations', 'passwords'].include?(controller_name)
    res = self.class.name.gsub(/Controller$/, '').singularize.constantize
    sym = controller_name.singularize.to_sym
    return unless params[sym].present?

    if params[:user].present?
      params[sym].delete(:password) if params[sym][:password].blank?
      params[sym].delete(:password_confirmation) if params[sym][:password_confirmation].blank?
    elsif params[sym][:user_attributes].present?
      params[sym][:user_attributes].delete(:password) if params[sym][:user_attributes][:password].blank?
      params[sym][:user_attributes].delete(:password_confirmation) if params[sym][:user_attributes][:password_confirmation].blank?
    end
  end
  
  def get_pdf_list(headings, values, options = {}, cell_style = {})
    pdf = Prawn::Document.new(:page_layout => :landscape)
    arr = []
    # defining cell headlines
    arr << headings
    # adding table
    arr.concat values.map{|row| row.map{|col| col.to_s.strip}}
    pdf.table(arr, {:row_colors => [ "FFFFFF", "DDDDDD" ], :cell_style => {:size => 7}.merge(cell_style)}.merge(options)) do
      row(0).border_width = 2
      row(0).font_style = :bold
      row(0).size = 8
    end

    pdf
  end

end
