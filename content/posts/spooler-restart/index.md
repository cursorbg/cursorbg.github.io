+++
date = '2024-10-28T16:11:45+02:00'
draft = false
hidden = false
title = 'Принтерът блокира! (Скрипт за Print Spooler)'
tags = ['принтер','натоварване','печат','спулер','spooler']
summary = 'Управлението на услугата "Print Spooler" е от съществено значение за администрацията на печатни услуги, тъй като спулерът осигурява правилното опашково разпределение и обработка на печатните задачи.'
+++
<span>{{< youtube ty5ON-DRAXM >}}</span>

Управлението на услугата "Print Spooler" е от съществено значение за администрацията на печатни услуги, тъй като спулерът осигурява правилното разпределение във вид на опашка и обработка на печатните задачи. Чрез използването на PowerShell, системните администратори могат лесно да автоматизират контрола на тази услуга, да оптимизират работата ѝ и бързо да диагностицират и решават проблеми.

В тази статия ще разгледаме как с помощта на PowerShell скрипт могат да се извършват основни операции като стартиране, спиране и рестартиране на услугата "Print Spooler", с цел да създадем такъв скрипт, който да проверява до каква степен този процес натоварва системата, да го рестартира и да премахва временните принт задачи.

## Системни услуги(system services)

{{< collapse summary="Какво са **system services** ? *(натисни за да видиш)*" open=false >}}
**System services** са фонови процеси или програми в операционната система, които изпълняват ключови функции за поддържане на нормалната работа на компютъра. Те стартират автоматично при зареждане на системата и осигуряват основни ресурси и услуги, като управление на мрежата, сигурност, управление на паметта и хардуерни взаимодействия.
{{< /collapse >}}

Преди да пристъпим към създаването на скрипта, трябва да разгледаме как се управляват услугите "ръчно".

Най-бързите начини за достъп до управлението на *system services* са много, но има няколко стандартни метода.

1. **Task Manager (Диспечер на задачи)**:
   - Натиснете **Ctrl + Shift + Esc** или **Ctrl + Alt + Delete** и изберете *Task Manager*.
   - Отидете в раздела **Services**, за да видите и управлявате текущите услуги.

2. **Services Management Console (Управление на услуги)**:
   - Натиснете **Win + R** и въведете `services.msc`, след което натиснете Enter.
   - Това ще отвори прозорец с всички услуги, където можете да ги стартирате, спрете или промените настройките им.

3. **Computer Management**:
   - Натиснете десен клавиш върху **старт** бутона и изберете **Computer Management** *(фиг. 1)*.

След като се отвори екрана за управление, остава само да открием услугата(service), която ни интересува и да приложим някое от следните действия: разрешаване/забраняване, старт/стоп/рестарт.

[![](sp1.png "{{< icon "link" >}}*фиг. 1*")](sp1.png)

## Проблем със спулера и как да го решим със скрипт

Понякога(всъщност доста често), поради комбинация от несъвместими драйвери, обновления или програми се получава голямо натоварване на системата от спулера, но не и пълно блокиране на системата. Проблемът изчезва, когато рестартираме компютъра или спулера, но това е много досадно и отнема време. Затова ще напишем скрипт, който да рестартира спулера, ако спулера натовари процесора до определено ниво.

```powershell {linenos=true}
#   ____ _   _ ____  ____   ___  ____  ____   ____
#  / ___| | | |  _ \/ ___| / _ \|  _ \| __ ) / ___|
# | |   | | | | |_) \___ \| | | | |_) |  _ \| |  _
# | |___| |_| |  _ < ___) | |_| |  _ <| |_) | |_| |
#  \____|\___/|_| \_\____/ \___/|_| \_\____/ \____|

# Скрипт за контрол на състоянието на спулер процеса

# получаване на текущото състояние
$cpuUsage = Get-CimInstance -Query "SELECT PercentProcessorTime FROM Win32_PerfFormattedData_PerfProc_Process WHERE Name='spoolsv'"

if ($cpuUsage.PercentProcessorTime -gt 60) {  # по подразбиране > 60%
    Restart-Service -Name Spooler
}
```

Това е достатъчно за да се рестартира процеса, след като превиши 60 процентната граница. Ако желаем да получаваме известия при всеки рестарт на спулера трябва да допълним скрипта по следният начин:

```powershell {linenos=true}
#   ____ _   _ ____  ____   ___  ____  ____   ____
#  / ___| | | |  _ \/ ___| / _ \|  _ \| __ ) / ___|
# | |   | | | | |_) \___ \| | | | |_) |  _ \| |  _
# | |___| |_| |  _ < ___) | |_| |  _ <| |_) | |_| |
#  \____|\___/|_| \_\____/ \___/|_| \_\____/ \____|

# Скрипт за контрол на състоянието на спулер процеса

# получаване на текущото състояние
$cpuUsage = Get-CimInstance -Query "SELECT PercentProcessorTime FROM Win32_PerfFormattedData_PerfProc_Process WHERE Name='spoolsv'"

if ($cpuUsage.PercentProcessorTime -gt 60) {  # по подразбиране > 60%
    Restart-Service -Name Spooler

    # Известие за проблем
    Add-Type -AssemblyName System.Windows.Forms
    $objNotifyIcon = New-Object System.Windows.Forms.NotifyIcon
    $objNotifyIcon.Icon = [System.Drawing.SystemIcons]::Information
    $objNotifyIcon.BalloonTipTitle = "Печатна тревога..."
    $objNotifyIcon.BalloonTipText = "Спулера не работи!"
    $objNotifyIcon.Visible = $true
    $objNotifyIcon.ShowBalloonTip(10000)
}
```

За съжаление понякога остават временни файлове и не е достатъчно само рестарт на услугата, а и да изтрием тези файлове. По подразбиране достъпът до папката, в която се записват файловете е забранен и се налага да я отворим през **File Explorer** поне веднъж `%SYSTEMROOT%\System32\Spool\PRINTERS\`. Тук трябва да вметнем и че тези файлове могат да бъдат изтривани само когато услугата е спряна. Ето и как ще изглежда крайният вариант на скрипта:

```powershell {linenos=true}
#   ____ _   _ ____  ____   ___  ____  ____   ____
#  / ___| | | |  _ \/ ___| / _ \|  _ \| __ ) / ___|
# | |   | | | | |_) \___ \| | | | |_) |  _ \| |  _
# | |___| |_| |  _ < ___) | |_| |  _ <| |_) | |_| |
#  \____|\___/|_| \_\____/ \___/|_| \_\____/ \____|

# Скрипт за контрол на състоянието на спулер процеса

# Определяне на пътя към папката %SYSTEMROOT%\System32\Spool\PRINTERS
$PrnTempFolder = "$env:SYSTEMROOT\System32\Spool\PRINTERS\"

# Списък с разширения на файлове, които ще бъдат изтрити
$Extensions = @("*.SPL", "*.SHD")

# получаване на текущото състояние
$cpuUsage = Get-CimInstance -Query "SELECT PercentProcessorTime FROM Win32_PerfFormattedData_PerfProc_Process WHERE Name='spoolsv'"

if ($cpuUsage.PercentProcessorTime -gt 60) {  # по подразбиране > 60%
    # спиране на услугата
    Stop-Service -Name Spooler

    # Цикъл, който преминава през всеки тип файл и го изтрива
    foreach ($Extension in $Extensions) {
        Get-ChildItem -Path $TempFolder -Filter $Extension -File | Remove-Item -Force
    }

    # стартиране на услугата
    Start-Service -Name Spooler

    # Известие за проблем
    Add-Type -AssemblyName System.Windows.Forms
    $objNotifyIcon = New-Object System.Windows.Forms.NotifyIcon
    $objNotifyIcon.Icon = [System.Drawing.SystemIcons]::Information
    $objNotifyIcon.BalloonTipTitle = "Печатна тревога..."
    $objNotifyIcon.BalloonTipText = "Спулера не работи!"
    $objNotifyIcon.Visible = $true
    $objNotifyIcon.ShowBalloonTip(10000)
}
```

{{< callout >}}
**Препоръка:** Създайте папка `%HOMEPATH%\scripts` и записвайте там своите скриптове. <br>**Забележка:** `%HOMEPATH%` е синоним (пряк път) към вашата home папка (`c:\Users\вашето потребителско име`).</br>
{{< /callout >}}

## Права на достъп

За да функционира този скрипт е необходимо Вашият потребител да е с администраторски права, ако ли не свържете се с Вашия администратор и му покажете тази статия.

## Стартиране на скрипта

За да направите така, че скрипта да се изпълнява автоматично прочетете [{{< icon "link" >}}тази статия]({{< ref "cpu-usage-mon#task-scheduler" >}}) или гледайте видеото към настоящата.

{{< callout >}}
**Важно:** Този скрипт трябва да се изпълнява на всяка минута.
{{< /callout >}}

 На (*фиг. 5*) от горепосочената статия трябва да изберете `{{< icon "checkbox-checked" >}} Repeat task every: 1 minute` и `for a duration of: Indefinitely`.
