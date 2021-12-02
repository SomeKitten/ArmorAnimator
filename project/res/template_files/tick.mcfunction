execute unless score timer animation matches 20.. run scoreboard players add timer animation 1
execute if score timer animation matches 20.. run scoreboard players set timer animation 0
execute as @e[type=!player] run data merge entity @s {DeathTime:19}
