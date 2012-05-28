# -*- coding: utf-8 -*-
class UsersController < AuthorizedController
  helper_method :sort_column, :sort_direction
  
  def index
    @users = @users.order(sort_column + " " + sort_direction).page(params[:page])
  end

  def members_list
    if params[:password].blank? || 5 > params[:password].length
      flash[:error] = t("helpers.pdf.password_needed") if params[:hidden_field]
      return 
    end
    pdf = Prawn::Document.new(:page_layout => :landscape)
    
    usr_arr = []
    # defining cell headlines
    usr_arr << [ "MNr. ", "Titel", "Nachname", "Vorname", "Beruf", "Grad", "Aufgenommen am" , "Angenommen am", "Geburtstag",
                 # business address
                 "gesch. Str", "gesch. Plz", "gesch. Ort", "gesch. Telefon", "gesch. Mobil", "gesch. Fax", "gesch. E-Mail", 
                 # private address
                 "priv. Str", "priv. Plz", "priv. Ort", "priv. Telefon", "priv. Fax", "priv. E-Mail", 
                 # position
                 "Ämter"
               ]
    # adding table
    @users.order(:lastname).order(:firstname).order(:matriculation_number).each do |usr|
      bsns_addr = usr.business_address
      priv_addr = usr.private_address
      usr_arr << [ usr.matriculation_number, usr.title_str, usr.lastname, usr.firstname, usr.job_title, usr.num_degree, 
                   usr.entered_apprentice_since, usr.accepted_at, usr.date_of_birth, 
                   # business address
                   bsns_addr.street, bsns_addr.zip, bsns_addr.city, bsns_addr.phone, bsns_addr.mobile, bsns_addr.fax, bsns_addr.email,
                   # private address
                   priv_addr.street, priv_addr.zip, priv_addr.city, priv_addr.phone, priv_addr.mobile, priv_addr.fax, priv_addr.email,
                   # positions
                   @user.positions.join(", ")
                 ]
    end
    pdf.table(usr_arr, :row_colors => [ "F0F0F0", "FFFFCC" ]) do
      row(0).border_width = 2
      row(0).font_style = :bold
    end

    pdf.encrypt_document(:user_password => params[:password], :owner_password => :random,
                         :permissions => { :print_document     => false,
                           :modify_contents    => false,
                           :copy_contents      => false,
                           :modify_annotations => false })
    send_data pdf.render, type: "application/pdf", :filename => "#{Date.today}-Mitgliederverzeichnis.pdf"
  end

  def show
  end

  def new
  end

  def create
    set_user_degree_dates(params)
    if @user.save
      redirect_to @user, notice: t("activerecord.create_success", model: t("activerecord.models.user"))
    else
      render :new
    end
  end

  def edit
    @limited_editing = limited_editing()
  end

  def update
    set_user_degree_dates(params)

    if @user.update_attributes(params[:user])
      UserMailer.change_notification(@user).deliver
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


  private
  
  def limited_editing
    [] == (current_user.roles & (Role.where(:name => ['Admin', 'Secretary'])))
  end

  def sort_column
    (User.column_names).include?(params[:sort_by]) ? params[:sort_by] : "lastname ASC, firstname ASC, email "
  end

  def set_user_degree_dates params
    @user.entered_apprentice_since= params[:user][:entered_apprentice_since] 
    @user.fellow_craft_since= params[:user][:fellow_craft_since]
    @user.master_mason_since= params[:user][:master_mason_since]

    params[:user][:role_ids] << Role.find_by_name('EnteredApprentice').id if(@user.entered_apprentice_since)
    params[:user][:role_ids] << Role.find_by_name('FellowCraft').id if(@user.fellow_craft_since)
    params[:user][:role_ids] << Role.find_by_name('MasterMason').id if(@user.master_mason_since)
  end
end
