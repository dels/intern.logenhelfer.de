class UsersController < AuthorizedController
  helper_method :sort_column, :sort_direction

  def index
    @users = view_context.get_authorized_paginated(User.undeleted.order(sort_column + " " + sort_direction)).page(params[:page])
  end

  def members_list
    if params[:password].blank? || 5 > params[:password].length
      flash[:error] = t("helpers.pdf.password_needed") if params[:hidden_field]
      return
    end
    pdf = get_pdf_list(I18n.t('pdf.members_list.header'),
      @users.undeleted.order('lastname ASC, firstname ASC, matriculation_number ASC').map {|usr|
        bsns_addr = usr.business_address
        priv_addr = usr.private_address
        addr_arr = []

        addr_arr << usr.matriculation_number
        addr_arr << usr.to_s.gsub!(/\s/, "\n")
        addr_arr << usr.job_title
        addr_arr << usr.num_degree
        addr_arr << (I18n.l(usr.entered_apprentice_since) rescue '')
        addr_arr << ((usr.accepted_at) ? I18n.l(usr.accepted_at) : "-")
        addr_arr << (I18n.l(usr.date_of_birth) rescue '')

        # business address
        address_template = "%s\n%s %s\nTel: %s\nMobil: %s\nFax: %s\nE-Mail: %s"

        if bsns_addr
          addr_arr << address_template % [bsns_addr.street, bsns_addr.zip, bsns_addr.city, bsns_addr.phone, bsns_addr.mobile, bsns_addr.fax, bsns_addr.email]
        else
          addr_arr << "-"
        end
        if priv_addr
          addr_arr << address_template % [priv_addr.street, priv_addr.zip, priv_addr.city, priv_addr.phone, priv_addr.mobile, priv_addr.fax, priv_addr.email]
        else
          addr_arr << "-"
        end
        # positions
        addr_arr << usr.positions.join("\n")
        addr_arr
      }, column_widths: { 1 => 50, 2 => 80, 7 => 120, 8 => 120 }, header: true
    )

    pdf.encrypt_document(
      user_password: params[:password],
      owner_password: :random,
      permissions: {
        print_document: false,
        modify_contents: false,
        copy_contents: false,
        modify_annotations: false
      }
    )
    send_data pdf.render, type: "application/pdf", filename: "#{Date.today}-Mitgliederverzeichnis.pdf"
  end

  def birthday_list
    @users = view_context.get_authorized_paginated(User.order(sort_column + " " + sort_direction)).page(params[:page])
  end

  def birthday_list_pdf
    send_data get_pdf_list(I18n.t('pdf.birthday_list.header'),
      @users.undeleted.order('lastname ASC, firstname ASC').to_a.map {|usr|
        [ usr.title_str,
          usr.lastname,
          usr.firstname,
          I18n.l(usr.date_of_birth),
          I18n.l(usr.entered_apprentice_since + 25.years),
          I18n.l(usr.entered_apprentice_since + 50.years) ]
      }).render, type: "application/pdf", filename: "#{Date.today}-Geburtstagsliste.pdf"
  end

  def phone_list
    @users = view_context.get_authorized_paginated(User.order(sort_column + " " + sort_direction)).page(params[:page])
  end

  def phone_list_pdf
    send_data get_pdf_list(I18n.t('pdf.phone_list.header'),
      @users.order('lastname ASC, firstname ASC').map {|usr|
        [ usr.title_str,
          usr.to_s.gsub!(/\s/, "\n"),
          usr.phone_numbers_printable,
          usr.fax_numbers_printable,
          usr.mobile_numbers_printable ]
    }, column_widths: {2 => 120, 3 => 120, 4 => 120}).render, type: "application/pdf", filename: "#{Date.today}-Telefonliste.pdf"
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
    # reset email, so that
    # (a) a login fails (deleted users are not able to login, though a
    #     "your account is not active" message will be diplayed, marking the
    #     presence of the account)
    # (b) the email address might be reused later -- without undeleting this
    #     user account and all its privileges (this is still possible using the
    #     archive).
    @user.email = "deleted-#{Time.now.to_i}-#{@user.email}"
    @user.save
    redirect_to users_url, notice: t("activerecord.destroy_success", model: t("activerecord.models.user"))
  end

  def substitute
    sign_in(:user, User.find(params[:id]))
    redirect_to root_url
  end

private

  def limited_editing
    [] == (current_user.roles & (Role.where(name: ['Admin', 'Secretary'])))
  end

  def sort_column
    (User.column_names).include?(params[:sort_by]) ? params[:sort_by] : "lastname ASC, firstname ASC, email "
  end

  def set_user_degree_dates params
    # since roles and degrees can only be changed by an admin we can return if the current user is no admin

    return unless current_user.roles.include?(Role.find_by_name('Admin'))

    @user.entered_apprentice_since = params[:user][:entered_apprentice_since]
    @user.fellow_craft_since = params[:user][:fellow_craft_since]
    @user.master_mason_since = params[:user][:master_mason_since]

    params[:user][:role_ids] << Role.find_by_name('EnteredApprentice').id if(@user.entered_apprentice_since)
    params[:user][:role_ids] << Role.find_by_name('FellowCraft').id if(@user.fellow_craft_since)
    params[:user][:role_ids] << Role.find_by_name('MasterMason').id if(@user.master_mason_since)
  end
end
