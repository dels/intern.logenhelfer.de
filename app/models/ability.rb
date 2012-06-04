class Ability
  include CanCan::Ability

  def initialize(user)
    return unless user
    @user = user

    @user.roles.each do |role|
      self.send("#{role.name.underscore}_abilities")
    end
    can [:show, :edit, :update], User, :id => @user.id
    can [:index, :show, :upcoming, :date], Event
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
    can [:index, :show, :members_list], User, ["users.deleted = ?", false] do |u|
      APP_CONFIG[:show_admins] || @user.roles.include?(admin_role) || !u.roles.include?(admin_role)
    end
  end

  # korrespondierender Schriftfuehrer
  def secretary_abilities
    can [:index, :create, :new, :show, :edit, :update], Event
    can [:index, :show, :edit, :update], User
  end

  # Deft
  def admin_abilities
    can :manage, Event
    can :manage, Category
    can :manage, Directory
    can :manage, AttachedFile
    can :manage, User
    can :index, FileDownload
  end

  #
  def uploader_abilities
    can :manage, Category
    can :manage, Directory
    can :manage, AttachedFile
  end

  # Lehrling
  def entered_apprentice_abilities
  end

  # Geselle
  def fellow_craft_abilities
  end

  # Meister
  def master_mason_abilities
  end

  # Meister vom Stuhl
  def worshipful_master_abilities
  end

  # Mitglied des Beamtenrates
  def member_of_council_abilities
  end
end


