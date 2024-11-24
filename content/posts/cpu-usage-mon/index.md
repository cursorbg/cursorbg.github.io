+++
date = '2024-10-28T16:11:31+02:00'
draft = false
hidden = false
title = 'Как да получавате известия при високо натоварване на процесора?'
tags = ['процесор','натоварване','powershell','task-scheduler']
summary = 'Колко често се е случвало компютъра да Ви се забавя ужасно?'
+++
<span>{{< youtube UtPteXQ3wzs >}}</span>

## PowerShell

В тази статия ще разгледаме как да използваме PowerShell за създаване на скрипт, който събира информация за натоварването на процесора. Този вид скриптове са изключително полезен за системните администратори и IT специалистите, тъй като позволява лесно и бързо наблюдение на използването на процесора в "реално време" или за определен период. Ще обясним как да използваме вградени командлети в PowerShell, за да съберем данни за натовареността, и ще покажем как тази информация може да бъде анализирана за идентифициране на потенциални проблеми в системната производителност.

{{< collapse summary="Какво е **PowerShell** ? *(натисни за да видиш)*" open=false >}}
**PowerShell** е мощен инструмент за автоматизация и управление, разработен от Microsoft. Той комбинира възможностите на команден интерфейс и скриптов език, което позволява на системни администратори и разработчици да автоматизират задачи, да управляват конфигурации и да работят със системни ресурси на Windows, Linux и macOS. Основният компонент на **PowerShell** е обектно-ориентирана среда, която използва команди, наречени cmdlet-и, за извършване на операции с обекти от .NET, което прави работата с данни и файлови системи по-интуитивна и гъвкава.
{{< /collapse >}}

## PowerShell ISE

И преди да започнем със скрипта няколко думи за това, какъв инструмент да използваме. Най-удобният инструмент е вградения в Windows - **PowerShell ISE** *(фиг. 1)*, какво трябва да знаем за сигурността, когато сваляме готови скриптове.

{{< collapse summary="Какво е **PowerShell ISE** ? *(натисни за да видиш)*" open=false >}}
**PowerShell ISE** (Integrated Scripting Environment) е интегрирана скриптова среда за PowerShell, разработена от Microsoft. Тя предлага удобен графичен интерфейс, който позволява на потребителите да пишат, редактират, тестват и изпълняват PowerShell скриптове. PowerShell ISE разполага с функции като *оцветяване на синтаксиса*, *автоматично довършване на команди*, и *дебъгинг*, което улеснява създаването на сложни скриптове и намалява вероятността от грешки. Тази среда е подходяща както за начинаещи, така и за напреднали потребители, които искат да автоматизират задачи и да управляват конфигурации в Windows системи.
{{< /collapse >}}

[![](PowerShell_ISE.png "{{< icon "link" >}}*фиг. 1*")](PowerShell_ISE.png)

## Сигурност

Сигурността при изпълнение на PowerShell скриптове е ключов аспект, особено в корпоративни среди, където неправилно написан или злонамерен скрипт може да изложи на риск цялата система. PowerShell разполага с няколко нива на защита, които се управляват чрез *Execution Policy* (политика за изпълнение) — настройка, която определя какви скриптове могат да бъдат изпълнявани.

{{< collapse summary="Основните команди за управление на тази политика са: *(натисни за да видиш)*" open=false >}}
- `Get-ExecutionPolicy` – показва текущото ниво на защита.
- `Set-ExecutionPolicy` – променя политиката за изпълнение, като предлага няколко нива:
  - `Restricted` – забранява изпълнението на скриптове.
  - `AllSigned` – позволява само подписани скриптове от доверени източници.
  - `RemoteSigned` – изисква подпис само за скриптове, изтеглени от интернет.
  - `Unrestricted` – разрешава изпълнението на всички скриптове, но предупреждава потребителя при стартиране на скрипт от интернет.
{{< /collapse >}}

Чрез използването на тези политики и подписването на скриптове администраторите могат да подсигурят изпълнението на PowerShell команди и да предотвратят потенциални заплахи.

В общия случай се използва политиката за *"отдалечено подписан скрипт"*, тъй като по този начин знаем кой е авторът на скрипта и се задава с командата `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` *(фиг.2)*.

[![](policy.png "{{< icon "link" >}}*фиг. 2*")](policy.png)

## Скрипт

Следва да преминем към забавната част. Копирайте си скрипта в клипборда, поставете го в **PowerShell ISE** и го запишете на място и с име, които трябва да запомните защото ще ви трябват по-късно. Можете да го стартирате със зелената стрелка и да го спрете със стоп бутона *(фиг. 1)*.

{{< callout >}}
Създайте папка `c:\Users\вашето потребителско име\scripts` и записвайте там своите скриптове.
{{< /callout >}}

{{< callout >}}
Всички скриптове трабва да носят разширение `.ps1`
{{< /callout >}}

```powershell {linenos=true}
#   ____ _   _ ____  ____   ___  ____  ____   ____
#  / ___| | | |  _ \/ ___| / _ \|  _ \| __ ) / ___|
# | |   | | | | |_) \___ \| | | | |_) |  _ \| |  _
# | |___| |_| |  _ < ___) | |_| |  _ <| |_) | |_| |
#  \____|\___/|_| \_\____/ \___/|_| \_\____/ \____|

# Скрипт за проверка състоянието на процесора и извеждане на информация
$cpuThreshold = 90  # предел на натоварването
$notificationCooldown = 300  # 300 seconds = 5 minutes
$notificationSentTime = $null
Add-Type -AssemblyName System.Windows.Forms

# Get the script's startup folder
$scriptStartupFolder = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Безкраен цикъл за следене състоянието на процесора
while ($true) {
    # Взимане на текущото натоварване на процесора от Task Manager
    $cpuUsage = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue

    # Ако натоварването на процесора надхвърли прага, регистрира събитието, ако това не се е случило в последните 5 мин.
    if ($cpuUsage -gt $cpuThreshold -and (!$notificationSentTime -or (New-TimeSpan -Start $notificationSentTime).TotalSeconds -ge $notificationCooldown)) {
        # Create a timestamp
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $message = "Warning: CPU usage is above $cpuThreshold%! Current usage is $cpuUsage% at $timestamp."

        # Регистрира събитието в текстов файл
        $logFile = "$scriptStartupFolder\cpu-alert-log.txt"
        Add-Content $logFile $message

        # Възможност за извеждане съобщение на екрана ( Windows 10+ )
        $objNotifyIcon = New-Object System.Windows.Forms.NotifyIcon
        $objNotifyIcon.Icon = [System.Drawing.SystemIcons]::Information
        $objNotifyIcon.BalloonTipTitle = "Warning!"
        $objNotifyIcon.BalloonTipText = "$message"
        $objNotifyIcon.Visible = $true
        $objNotifyIcon.ShowBalloonTip(10000)

        # Записва кога е изпратено съобщението
        $notificationSentTime = Get-Date
    }

    # Пауза за 5 секунди преди следващата проверка
    Start-Sleep -Seconds 5
}

```

## Скриване на прозореца при изпълнение

При изпълнението на всеки скрипт в Windows винаги има видим прозорец (PowerShell ISE, PowerShell конзолата или Windows Terminal). Към този момент сме открили само един начин за ефективно скриване на прозореца. Оригиналният скрипт на Andreas Mariotti може да бъде намерен [{{< icon "link" >}}тук](https://www-mariotti-de.translate.goog/simpler-powershell-host-zum-ausfuehren-von-powershell-skripten-ohne-stoerendes-konsolenfenster/?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=de&_x_tr_pto=wapp). В нашата версия има леки промени, но като цяло е запазен оригиналът.

```powershell {linenos=true}
# Original script by Andreas Mariotti:
# https://www-mariotti-de.translate.goog/simpler-powershell-host-zum-ausfuehren-von-powershell-skripten-ohne-stoerendes-konsolenfenster/?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=de&_x_tr_pto=wapp

# Get the script's startup folder
$scriptStartupFolder = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Inline C# code for a simple PowerShell host and compile
$code = @'
using System.Management.Automation;
using System.Collections.ObjectModel;
namespace PowerShellHost {
  class Program {
    static void Main(string[] args) {
      if (args.Length == 0) return;
      using (PowerShell ps = PowerShell.Create()) {
        string code = System.IO.File.ReadAllText(args[0]);
        ps.AddScript(code);
        Collection <PSObject> psobject = ps.Invoke();
      }
    }
  }
}
'@

# Compile
Add-Type -OutputAssembly "$scriptStartupFolder\PowerShellHost.exe" -OutputType 'WindowsApplication'  -TypeDefinition $code

```

Скрипта трябва да запишете на същото място както и предния, след което е достатъчно да се стартира веднъж и в същата папката ще се появи **PowerShellHost.exe**.

## Task Scheduler

Следващата стъпка е да настроим Windows да пуска скрипта при стартиране. За тази цел ще използваме **Task Scheduler** *(фиг. 3)* компонента на операционната система.

{{< collapse summary="Какво е **Task Scheduler** ? *(натисни за да видиш)*" open=false >}}
**Task Scheduler** е вграден инструмент в операционната система Windows за автоматизиране на изпълнението на задачи. Позволява планиране на стартирането на програми, скриптове или други процеси в определено време, при настъпване на зададени събития или по установен график. Task Scheduler работи във фонов режим и може да се използва за редовни задачи като архивиране на данни, обновления на софтуер или системни проверки.
{{< /collapse >}}

За да стартирате Task Scheduler, можете да натиснете {{< icon "microsoft-windows" >}} клавиша на клавиатурата и да изпишете `sched` или `task`.

[![](TaskScheduler.png "{{< icon "link" >}}*фиг. 3*")](TaskScheduler.png)

В инструмента трябва да натиснете върху `Task Scheduler Library`(1) в лявата секция, след което ще се появи в дясната секция възможност за създаване на нова задача `Create Task...`(2) *(фиг. 4)*.

[![](cpu1.png "{{< icon "link" >}}*фиг. 4*")](cpu1.png)

За име(3) на задачата напишете нещо кратко, което да Ви подсеща за темата на задачата. В описанието(4) може да се отпуснете и да пишете по-подробно. Точка (5) от *(фиг. 4)* указва изпълнението на задачата да се извърши само след зареждане на *потребителя*.

[![](cpu2.png "{{< icon "link" >}}*фиг. 5*")](cpu2.png)

Сега трябва да зададем на второто "табче", кога да се стартира задачата като следваме стъпките от *(фиг. 5)*.

[![](cpu3.png "{{< icon "link" >}}*фиг. 6*")](cpu3.png)

Аналогично следвате стъпките от *(фиг. 6)* и ако сте спазили препоръкта по-рано, в стъпка (4) трябва да сте получили `"c:\Users\вашето потребителско име\scripts\PowerShellHost.exe"`, а в стъпка (5) `"c:\Users\вашето потребителско име\scripts\името на скрипт1.ps1"`.

[![](cpu4.png "{{< icon "link" >}}*фиг. 7*")](cpu4.png)

[![](cpu5.png "{{< icon "link" >}}*фиг. 8*")](cpu5.png)

Пресъздайте настройките, както са показани на *(фиг. 7)* и *(фиг. 8)*. Когато сте готови запишете задачата с `ОК` бутона.

Вече всичко е готово! Сега, ако не ни се чака до следващия рестарт на системата можем да натиснем десен клавиш върху задачата и да изберем `Run`.

## Бонус съдържание

Разбира се може да направите промени по скрипта. Например, ако желаете скриптът да реагира по-рано можете да промените ред 8 със желаната стойност

```powershell
$cpuThreshold = 75  # предел на натоварването
```

или да промените известието(ред 25) на български език

```powershell
$message = "Натоварването на процесора е над $cpuThreshold%! В $timestamp натоварването е $cpuUsage%."
```

Експериментирайте...
