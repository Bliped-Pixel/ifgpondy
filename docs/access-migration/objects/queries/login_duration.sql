SELECT login_record.user_name, login_record.login_time, login_record.logout_time, DateDiff("n",[login_time],[logout_time]) AS minutes, [minutes]\60 AS hours, [minutes]-([hours]*60) AS min_left, [hours] & " H:" & [min_left] & " Min" AS duration
FROM login_record;

