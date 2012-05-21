class Ability
  include CanCan::Ability
 
  def initialize(user)
    return unless user
    @user = user

    @user.roles.each do |role|
      self.send("#{role.name.underscore}_abilities")
    end
    can [:show, :edit, :update], User, :id => @user.id

    can [:index, :show], Category, ['categories.deleted = ?', false] do |c|
      [] != (c.roles & @user.roles)
    end
    can [:index, :show], Directory, ['directories.deleted = ?', false] do |d|
      [] != (d.roles & @user.roles)
    end
    can [:index, :show, :download], AttachedFile, ['attached_files.deleted = ?', false] do |f|
      [] != (f.roles & @user.roles)
    end
    can [:index, :show, :members_list], User, ["users.deleted = ?", false] do |u|
      [] != (u.roles & @user.roles)
    end
  end

  def admin_abilities
    can :manage, Category
    can :manage, Directory
    can :manage, AttachedFile
    can :manage, User
    can :index, FileDownload
  end

  def uploader_abilities
    can :manage, Category
    can :manage, Directory
    can :manage, AttachedFile
  end

  def entered_apprentice_abilities
  end

  def fellow_craft_abilities
  end

  def master_mason_abilities
  end

  def worshipful_master_abilities
  end

  def member_of_council_abilities
  end
end


