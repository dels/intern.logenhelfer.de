#encoding: utf-8

class MigrateAcademicTitles < ActiveRecord::Migration
  TITLES = {
    1   => 'Dipl. Ing.',
    10  => 'Dipl. Kfm.',
    20  => 'Dipl.-Inf.',
    30  => 'Dipl. Ing.',
    40  => 'Dipl. Ökonom',
    50  => 'Dipl. Bankbetriebswirt',
    60  => 'Dipl.-Betr.Wirt',
    70  => 'Dr.',
    80  => 'Dr.-Ing.',
    90  => 'Prof. Dipl.-Ing.',
    100 => 'Prof. Dr.',
    110 => 'Prof. Dr.-Ing.'
  }

  def up
    TITLES.keys.each do |pos|
      TITLES[pos] = AcademicTitle.where(short: TITLES[pos]).first_or_create
    end

    say_with_time 'migrating user titles' do
      User.find_in_batches(batch_size: 100) do |users|
        say "batch-processing #{users.size} users", true
        User.transaction do
          users.each do |u|
            next if u.title.blank?
            u.academic_title_id = TITLES[u.title].id
            u.save
          end
        end
      end
    end
  end

  def down
    AcademicTitle.destroy_all
  end
end
