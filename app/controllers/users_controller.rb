# -*- coding: utf-8 -*-
class UsersController < AuthorizedController
  helper_method :sort_column, :sort_direction
  
  def index
    @users = view_context.get_authorized_paginated(User.order(sort_column + " " + sort_direction)).page(params[:page])
  end

  def members_list
    if params[:password].blank? || 5 > params[:password].length
      flash[:error] = t("helpers.pdf.password_needed") if params[:hidden_field]
      return
    end
    pdf = Prawn::Document.new(:page_size => "A4" ,:page_layout => :landscape, :compress => :true)
    pdf.font_size = 10
    usr_arr = []
    addr_arr = []
    # defining cell headlines
    usr_arr << [ "MNr. ", "Name", "Beruf", "Grad", "Aufg. am" , "Ang. am", "Geburtstag",
                 "beruflich", "privat", "Ämter" ]
    # adding table
    @users.order(:lastname).order(:firstname).order(:matriculation_number).each do |usr|
      bsns_addr = usr.business_address
      priv_addr = usr.private_address
      addr_arr = []

      addr_arr << usr.matriculation_number
      addr_arr << usr.to_s.gsub!(/\s/, "\n")
      addr_arr << usr.job_title
      addr_arr << usr.num_degree
      addr_arr << I18n.l(usr.entered_apprentice_since)
      addr_arr << ((usr.accepted_at) ? I18n.l(usr.accepted_at) : "-")
      addr_arr << I18n.l(usr.date_of_birth)

      # business address
      if bsns_addr
        addr_arr << "#{bsns_addr.street}\n#{bsns_addr.zip} #{bsns_addr.city}\nTel: #{bsns_addr.phone}\nMobil: #{bsns_addr.mobile}\nFax: #{bsns_addr.fax}\nE-Mail: #{bsns_addr.email}"
      else
        addr_arr << "-"
      end
      if priv_addr
        addr_arr << "#{priv_addr.street}\n#{priv_addr.zip} #{priv_addr.city}\nTel: #{priv_addr.phone}\nMobil: #{priv_addr.mobile}\nFax: #{priv_addr.fax}\nE-Mail: #{priv_addr.email}"
      else
        addr_arr << "-"
      end
      # positions
      addr_arr << usr.positions.join("\n")
      usr_arr << addr_arr
    end
    logger.fatal(usr_arr)
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
  
  def birthday_list
    @users = view_context.get_authorized_paginated(User.order(sort_column + " " + sort_direction)).page(params[:page])
  end
  
  def birthday_list_pdf
    send_pdf_list([ "Titel", "Nachname", "Vorname", "Geburtstag", "25. Jubiläum" , "50. Jubiläum" ],
      @users.order(:lastname).order(:firstname).to_a.map {|usr|
        [ usr.title_str,
          usr.lastname,
          usr.firstname,
          I18n.l(usr.date_of_birth),
          I18n.l(usr.entered_apprentice_since+25.years),
          I18n.l(usr.entered_apprentice_since+50.years) ]
      }, "Geburtstagsliste")
  end
  
  def phone_list
    @users = view_context.get_authorized_paginated(User.order(sort_column + " " + sort_direction)).page(params[:page])
  end
  
  def phone_list_pdf
    send_pdf_list([ "Titel", "Nachname", "Vorname", "Telefon", "Mobil" , "Fax" ],
      @users.order(:lastname).order(:firstname).map {|usr|
        [ usr.title_str,
          usr.lastname,
          usr.firstname,
          usr.phone_numbers_printable,
          usr.fax_numbers_printable,
          usr.mobile_numbers_printable ]
    }, "Telefonliste")
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
