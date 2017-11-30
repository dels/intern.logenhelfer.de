class Ability
  include CanCan::Ability

  def default_user_abilities
    can [:google_sync, :create_google_contact, :update_google_contact], User
    can [:show, :edit, :update, :update_announcement_subscription], User, id: @user.id
    can [:show, :create, :edit, :update], ExternalEventParticipant, user_id: @user.id
    can [:index, :show], Announcement
    can [:index, :show], ExternalEvent
    can [:add_me, :remove_me], ExternalEvent, user_id: @user.id
    can [:index, :show, :upcoming, :date, :public_workingplan, :internal_workingplan], Event
    can [:index, :show], Category, ['categories.deleted = ?', false] do |c|
      [] != (c.roles & @user.roles)
    end
    can [:index, :show], Directory, ['directories.deleted = ?', false] do |d|
      [] != (d.roles & @user.roles)
    end
    can [:index, :show, :download], AttachedFile, ['attached_files.deleted = ?', false] do |f|
      [] != (f.roles & @user.roles)
    end
    admin_role = Role.find_by_name("Admin")
    user_admin_role = Role.find_by_name("UserAdmin")
    
    can [:index, :show, :members_list, :phone_list, :birthday_list, :members_of_council, :file_io_link], User, ["users.deleted = false"] { |u|
      AppConfig[:show_admins] || @user.roles.include?(admin_role) || !u.roles.include?(admin_role)
    }
    can [:index, :file_stats, :mem_stats, :downloads], Statistic
  end
  
  # admin
  def admin_abilities
    worshipful_master_abilities
    secretary_abilities
    net_delegate_abilities
    user_admin_abilities
    application_admin_abilities
    member_of_council_abilities
    can :manage, Statistic
  end
  
  # korrespondierender Schriftfuehrer
  def secretary_abilities
    working_plan_admin_abilities
    announcement_admin_abilities
    lodges_admin_abilites
    file_admin_abilities
    user_admin_abilities
    can :manage, Statistic
  end

  # Meister vom Stuhl
  def worshipful_master_abilities
    working_plan_admin_abilities
    announcement_admin_abilities
    file_admin_abilities
    lodges_admin_abilites
    can :manage, Seeker
  end
  
  # Internet-Beauftragter
  def net_delegate_abilities
    file_admin_abilities
    user_admin_abilities
    can :manage, Statistic
  end
  
  # Mitglied des Beamtenrates
  def member_of_council_abilities
    can [:index, :file_stats, :user_stats, :user_file_stats, :space_stats], Statistic
    can [:csv_export], User
    can [:index, :show, :accepted, :inactive, :declined], Seeker
  end

  #
  def file_admin_abilities
    can :manage, Category
    can :manage, Directory
    can :manage, AttachedFile
  end

  def user_admin_abilities
    can [:index, :show, :members_list, :phone_list, :birthday_list, :edit, :update, :destroy, :create, :csv_export], User, ["users.deleted = false"] do |u|
      AppConfig[:show_admins] || @user.admin? || !u.admin?
    end
    can :manage, UserRole
  end
  
  def initialize(user)
    can :workingplan, Event
    return unless user
    @user = user
    
    @user.roles.each do |role|
      method = :"#{role.name.underscore}_abilities"
      self.send(method) if self.respond_to?(method)
    end

    
  end
  
  def working_plan_admin_abilities
    can :manage, Event
    can :manage, ExternalEvent
  end
  
  def lodges_admin_abilites
    can :manage, Lodge
    can :manage, Officer
  end

  
  def application_admin_abilities
    can :manage, AppConfig
    can :manage, AcademicTitle
    can :manage, District
    can :manage, Role
    can :manage, User
    can :manage, Category
    can :manage, Lodge
    can :manage, Officer
    can :manage, Event
    can :manage, ExternalEvent
  end
  
  def announcement_admin_abilities
    can :manage, Announcement
  end
  
  # Lehrling
  def entered_apprentice_abilities
    default_user_abilities
  end

  
  # Geselle
  def fellow_craft_abilities
    entered_apprentice_abilities
  end
  
  # Meister
  def master_mason_abilities
    fellow_craft_abilities
  end
  
  
end


