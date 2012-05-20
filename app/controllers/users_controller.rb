class UsersController < AuthorizedController

  def index
  end

  def members_list
    if params[:password].blank? || 5 > params[:password].length
      flash[:error] = t("helpers.pdf.password_needed") if params[:hidden_field]
      return 
    end
    pdf = Prawn::Document.new(:page_layout => :landscape)
    
    usr_arr = []
    # defining cell headlines
    usr_arr << [ "Nachname", "Vorname", "Grad", "Aufgenommen am" , "Angenommen am", "Geburtstag" ]
    # adding table
    @users.each do |usr|
      usr_arr << [ usr.lastname, usr.firstname, usr.num_degree, usr.included_at, usr.accepted_at, usr.date_of_birth ]
    end
    pdf.table(usr_arr, :row_colors => ["F0F0F0", "FFFFCC"]) do
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
    if @user.save
      redirect_to @user, notice: t("activerecord.create_success", model: t("activerecord.models.user"))
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @user.update_attributes(params[:user])
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
end
