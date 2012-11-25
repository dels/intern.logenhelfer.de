class Ability
  include CanCan::Ability

  def initialize(user)
    can :workingplan, Event
    return unless user
    @user = user

    @user.roles.each do |role|
      archive = APP_CONFIG[:archive] ? 'archive_' : ''
      method = :"#{role.name.underscore}_#{archive}abilities"

      self.send(method) if self.respond_to?(method)
    end
    can [:show, :edit, :update], User, :id => @user.id unless APP_CONFIG[:archive]
    # can [:index, :show, :upcoming, :date], Event
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
    can [:index, :show, :members_list, :phone_list, :birthday_list], User, ["users.deleted = false"] do |u|
      APP_CONFIG[:show_admins] || @user.roles.include?(admin_role) || !u.roles.include?(admin_role)
    end
  end

  # korrespondierender Schriftfuehrer
  def secretary_abilities
    can [:index, :create, :new, :show, :edit, :update, :upcoming, :date, :public_workingplan, :internal_workingplan], Event
    can [:index, :show, :edit, :update], User
  end

  def secretary_archive_abilities
    can [:index, :show], Event
    can [:index, :show], User
  end

  # Deft
  def admin_abilities
    can :manage, Event
    can :manage, Category
    can :manage, Directory
    can :manage, AttachedFile
    can :manage, User
    can :index, FileDownload
    can :manage, Statistic

  end

  def admin_archive_abilities
    # can [:index, :show, :destroy], Event
    can [:index, :show, :destroy], Category
    can [:index, :show, :destroy], Directory
    can [:index, :show, :destroy], AttachedFile
    can [:index, :show], User
    can :index, FileDownload
  end

  #
  def uploader_abilities
    can :manage, Category
    can :manage, Directory
    can :manage, AttachedFile
  end

  def uploader_archive_abilities
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
  end

  def member_of_council_archive_abilities
  end
end


