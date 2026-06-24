---
title: "Installing Xsquare Suite v3.5.8 on Windows 11"
date: "2026-06-24"
tags: ["EVS", "Xsquare", "Windows 11", "SQL Server", ".NET", "SNMP", "Broadcast"]
draft: false
---

## TL;DR

Four things break installing Xsquare Suite 3.5.8 on Windows 11. Run all of this in an elevated PowerShell first, then run the suite installer.

```powershell
# 1. SQL Server 2005 won't install — install SQL 2019 Express in its place
Invoke-WebRequest "https://go.microsoft.com/fwlink/?linkid=866658" -OutFile SQL2019-SSEI-Expr.exe
.\SQL2019-SSEI-Expr.exe /ACTION=Download /MEDIATYPE=Core /MEDIAPATH=C:\Temp\sql /QUIET
C:\Temp\sql\SQLEXPR_x64_ENU.exe /q /x:C:\Temp\sql\setup
C:\Temp\sql\setup\SETUP.EXE /QUIET /ACTION=Install /FEATURES=SQLENGINE `
  /INSTANCENAME=MSSQLSERVER /SECURITYMODE=SQL /SAPWD=... `
  /SQLSYSADMINACCOUNTS="BUILTIN\Administrators" `
  /TCPENABLED=1 /SQLCOLLATION=Latin1_General_CI_AS /IACCEPTSQLSERVERLICENSETERMS
sqlcmd -S localhost -E -Q "ALTER LOGIN sa WITH CHECK_POLICY=OFF; ALTER LOGIN sa WITH PASSWORD=N'evs';"

# 2. Xsquare needs .NET 2.0 — enable .NET 3.5
Enable-WindowsOptionalFeature -Online -FeatureName NetFx3 -All

# 3. SNMP component needs the SNMP service
Add-WindowsCapability -Online -Name "SNMP.Client~~~~0.0.1.0"
```

Then run `XsquareSuiteInstaller_Setup_3.5.8.0.exe`. During database creation you'll get "not enough disk space" warnings — ignore them, they're a SQL Express size-cap false alarm.

---

## 1. SQL Server 2005 won't install

The suite bundles SQL Server 2005 Express, which won't install on Windows 11.

**Fix:** install SQL Server 2019 Express first (the 4.17 build ships with 2019, so it's supported), matching what `EVS_SQL_Express_Install.ini` expects: a default instance, mixed-mode auth, `Latin1_General_CI_AS` collation. In an elevated PowerShell:

```powershell
# download the SQL Server 2019 Express installer
Invoke-WebRequest "https://go.microsoft.com/fwlink/?linkid=866658" -OutFile SQL2019-SSEI-Expr.exe

# pull the full offline media (produces SQLEXPR_x64_ENU.exe)
.\SQL2019-SSEI-Expr.exe /ACTION=Download /MEDIATYPE=Core /MEDIAPATH=C:\Temp\sql /QUIET

# extract the media
C:\Temp\sql\SQLEXPR_x64_ENU.exe /q /x:C:\Temp\sql\setup

# install: default instance, mixed-mode auth, matching collation
C:\Temp\sql\setup\SETUP.EXE /QUIET /ACTION=Install /FEATURES=SQLENGINE `
  /INSTANCENAME=MSSQLSERVER /SECURITYMODE=SQL /SAPWD=... `
  /SQLSYSADMINACCOUNTS="BUILTIN\Administrators" `
  /TCPENABLED=1 /SQLCOLLATION=Latin1_General_CI_AS /IACCEPTSQLSERVERLICENSETERMS
```

The bootstrapper connects as `sa` with the password `evs`, so set that. It's too short for the default password policy, so turn the policy off for the login. Run it with `sqlcmd` using Windows auth (the local admin is a SQL sysadmin):

```powershell
sqlcmd -S localhost -E -Q "ALTER LOGIN sa WITH CHECK_POLICY=OFF; ALTER LOGIN sa WITH PASSWORD=N'evs';"
```

### "Not enough free disk space in SQL Server's Data folder"

During database creation:

```
Error while processing DB operations: setting 'NC' database's initial
size. Not enough free disk space in SQL Server's Data folder?
```

**Fix:** dismiss it. The databases are created at 8 MB with autogrow, which is plenty for config and metadata. Use Developer Edition instead of Express, which has no 10 GB cap.

## 2. .NET Framework 2.0 not found

The Xsquare component needs .NET 2.0, which lives in .NET 3.5. On a clean Windows 11 that feature is `DisabledWithPayloadRemoved`:

```
.Net Framework 2.0 not found. Please first install it and try again.
```

**Fix:** in an elevated PowerShell:

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName NetFx3 -All
```

Or in the GUI: Control Panel → **Turn Windows features on or off** → tick **.NET Framework 3.5 (includes .NET 2.0 and 3.0)**.

## 3. SNMP setup fails

The Common SNMP Agent enables the Windows SNMP feature with `pkgmgr.exe`, which was removed from Windows 11, so the installer stops with:

```
Please first enable SNMP in Windows component and run Common SNMP Agent setup again.
```

**Fix:** SNMP is now a Feature-on-Demand. In an elevated PowerShell:

```powershell
Add-WindowsCapability -Online -Name "SNMP.Client~~~~0.0.1.0"
```

Or in the GUI: Settings → **Optional features** → **Add an optional feature** → **Simple Network Management Protocol (SNMP)**.

Then re-run the suite.
