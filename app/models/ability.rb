class Ability
  include CanCan::Ability
  
  def initialize(user)
    can :workingplan, Event
    return unless user
    @user = user
    
    @user.roles.each do |role|
      archive = AppConfig[:archive] ? 'archive_' : ''
      method = :"#{role.name.underscore}_#{archive}abilities"
      self.send(method) if self.respond_to?(method)
    end
    can [:show, :edit, :update, :update_announcement_subscription], User, id: @user.id unless AppConfig[:archive]
    #    can [:show, :create, :edit, :update], ExternalEventParticipant, user_id: @user.id
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
    
    can [:index, :show, :members_list, :phone_list, :birthday_list, :members_of_council], User, ["users.deleted = false"] do |u|
      AppConfig[:show_admins] || @user.roles.include?(admin_role) || !u.roles.include?(admin_role)
    end
    can [:index, :file_stats, :mem_stats, :downloads], Statistic
  end
  
  def working_plan_admin_abilities
    can :manage, Event
    can :manage, ExternalEvent
  end
  
  def user_admin_abilities
    admin_role = Role.find_by_name("Admin")
    can [:index, :show, :members_list, :phone_list, :birthday_list, :edit, :update, :destroy], User, ["users.deleted = false"] do |u|
      AppConfig[:show_admins] || @user.roles.include?(admin_role) || !u.roles.include?(admin_role)
    end
  end
  
  def application_admin_abilities
    can :manage, AppConfig
    can :manage, AcademicTitle
    can :manage, Role
  end
  
  # korrespondierender Schriftfuehrer
  def secretary_abilities
    working_plan_admin_abilities
    can :manage, Announcement
    can :manage, User
    can :manage, Statistic
  end
  
  def secretary_archive_abilities
    can [:index, :show], Event
    can [:index, :show], User
    
  end
  
  # Deft
  def admin_abilities
    working_plan_admin_abilities
    file_admin_abilities
    can :manage, User
    can :manage, Statistic
    can :manage, AppConfig
    can :manage, AcademicTitle
    can :manage, Role
    can :manage, Announcement
  end
  
  def admin_archive_abilities
    # can [:index, :show, :destroy], Event
    can [:index, :show, :destroy], Category
    can [:index, :show, :destroy], Directory
    can [:index, :show, :destroy], AttachedFile
    can [:index, :show], User
  end
  
  def announcement_admin_abilities
    can :manage, Announcement
  end
  
  def announcement_admin_archive_abilities
    can :manage, Announcement
  end
  
  #
  def file_admin_abilities
    can :manage, Category
    can :manage, Directory
    can :manage, AttachedFile
  end
  
  def file_admin_archive_abilities
    can [:index, :show, :destroy], Category
    can [:index, :show, :destroy], Directory
    can [:index, :show, :destroy], AttachedFile
  end
  
  # Lehrling
  def entered_apprentice_abilities
  end

  def entered_apprentice_archive_abilities
  end
  
  # Geselle
  def fellow_craft_abilities
  end
  
  def fellow_craft_archive_abilities
  end
  
  # Meister
  def master_mason_abilities
  end
  
  def master_mason_archive_abilities
  end
  
  # Meister vom Stuhl
  def worshipful_master_abilities
  end
  
  def worshipful_master_archive_abilities
  end
  
  # Mitglied des Beamtenrates
  def member_of_council_abilities
    can [:index, :file_stats, :user_stats, :user_file_stats, :space_stats], Statistic
    can [:csv_export], User
  end
  
  def member_of_council_archive_abilities
  end
  
  # Internet-Beauftragter
  def net_delegate_abilities
    file_admin_abilities
    can :manage, User
    can :manage, Statistic
  end
  
  def net_delegate_archive_abilities
  end
end


