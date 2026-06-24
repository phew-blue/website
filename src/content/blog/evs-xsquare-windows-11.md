---
title: "Installing Xsquare Suite v3.5.8 on Windows 11"
description: "The blockers installing a 2015 EVS broadcast suite on a current OS — SQL Server, .NET, and SNMP — and the fix for each."
date: "2026-06-24"
tags: ["EVS", "Windows 11", "SQL Server", "Broadcast"]
draft: false
---

EVS Xsquare Suite 3.5.8 dates from November 2015. On Windows 11 (build 26200) it fails partway through installation, several times over. Compatibility mode addresses none of it — the blockers are a database engine that won't install, a missing runtime, and a Windows feature the installer enables with a command that no longer exists.

Each issue and its fix, in the order they appear.

## SQL Server 2005 won't install (error 70000)

The suite bundles SQL Server 2005 Express as its database. Setup runs it and fails:

```
SQL Server setup returned 70000
SQL Server is required but has not been installed. Continue?
```

SQL 2005 does not install on Windows 11. With no engine, the first database-backed component (Notification Center) can't connect and the suite aborts.

**Fix:** install a supported engine by hand before running the suite. The bundled config (`EVS_SQL_Express_Install.ini`) defines what EVS expects:

```
INSTANCENAME=MSSQLSERVER
SECURITYMODE=SQL
SAPWD=EVSpass!
SQLCOLLATION=Latin1_General_CI_AS
```

A default instance, mixed-mode auth, that collation. The 4.17 build ships with SQL Server 2019, so it's a supported engine for this stack. Install SQL Server 2019 Express to match:

```
SETUP.EXE /QUIET /ACTION=Install /FEATURES=SQLENGINE
  /INSTANCENAME=MSSQLSERVER /SECURITYMODE=SQL /SAPWD=...
  /SQLSYSADMINACCOUNTS="BUILTIN\Administrators"
  /TCPENABLED=1 /SQLCOLLATION=Latin1_General_CI_AS /IACCEPTSQLSERVERLICENSETERMS
```

Note: the failed 2005 attempt installs the SQL Server 2005 Backward Compatibility pack, which includes SQL-DMO — the COM library the EVS bootstrapper uses to detect a SQL instance. With it registered and a real instance present, the installer detects SQL and stops trying to install its own.

## sa authentication fails

When SQL is already installed, the bootstrapper skips its own SQL step and therefore never reads `SAPWD` from the ini. It falls back to a built-in default and connects as `sa` with the password `evs`:

```
NotificationCenter_Setup ... /sqllogin="sa" /sqlpass="evs" /sqluselocal="yes"
```

So the engine's `sa` password must be `evs`, not the `EVSpass!` from the ini.

**Fix:** set the sa password to `evs`. It's too short for the default password policy, so disable the policy on that login:

```sql
ALTER LOGIN sa WITH CHECK_POLICY = OFF;
ALTER LOGIN sa WITH PASSWORD = N'evs';
ALTER LOGIN sa ENABLE;
```

## "Not enough free disk space in SQL Server's Data folder"

During database creation:

```
Error while processing DB operations: setting 'NC' database's initial
size. Not enough free disk space in SQL Server's Data folder?
```

This is a false alarm — it appears with plenty of disk free. The real cause is SQL Server Express's 10 GB-per-database limit: the installer tries to pre-size each database larger than that, SQL refuses the resize, and the installer reports it as a disk-space problem. It shows once per database (NC, Authentication, Xsquare).

**Fix:** dismiss it. The databases are created at the default 8 MB with autogrow enabled, which is sufficient for config and metadata. If large databases are genuinely required, use SQL Server Developer Edition instead of Express — same engine, no 10 GB cap.

## .NET Framework 2.0 not found

The main Xsquare component stops with:

```
.Net Framework 2.0 not found. Please first install it and try again.
```

.NET 2.0 is part of .NET 3.5, which on a clean Windows 11 is `DisabledWithPayloadRemoved`.

**Fix:** enable it.

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName NetFx3 -All
```

Enabling .NET 3.5 from a remote/SSH session can fail with `0x80070005` (access denied), because the component-store change needs privileges that session doesn't get. Run it from a local elevated session, or via Control Panel → "Turn Windows features on or off".

## SNMP setup fails (pkgmgr.exe removed)

The Common SNMP Agent component enables the Windows SNMP feature with a deprecated command:

```
pkgmgr.exe /iu:SNMP /quiet   ->  -2146498548
```

`pkgmgr.exe` was removed from Windows years ago; on Windows 11 it returns `0x800F080C` and does nothing. The SNMP service is never created, and EVS stops with "Please first enable SNMP in Windows component and run Common SNMP Agent setup again."

**Fix:** install SNMP, which on Windows 11 is a Feature-on-Demand rather than a classic Windows feature:

```powershell
Add-WindowsCapability -Online -Name "SNMP.Client~~~~0.0.1.0"
```

Or Settings → Optional features → Add a feature → "Simple Network Management Protocol (SNMP)". Confirm a service named `SNMP` exists, then re-run the suite.

## Result

With SQL 2019, the `sa`/`evs` login, .NET 3.5, and SNMP all in place, the suite installs every component — Notification Center, Authentication, Workflow Gateway and Host, Xsquare, XSecure, Common SNMP Agent, XTAccess, XTGateway, Association Tool — each returning 0, with all EVS services running.

The recurring theme: the installer's error messages name the wrong cause. "SQL required" means SQL 2005 can't install on this OS; "not enough disk space" means the Express size cap; the SNMP message is accurate but the command behind it is a decade out of date.
