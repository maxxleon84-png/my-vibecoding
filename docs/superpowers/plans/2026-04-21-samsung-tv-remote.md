# Samsung TV Remote Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Android-приложение (Kotlin + Compose) для управления Samsung UE40H6410AU по TCP-протоколу порта 55000. Установка через sideload APK из GitHub Releases.

**Architecture:** Один модуль `app`. Четыре слоя — UI (Compose) → ViewModel (`RemoteController`) → сеть (`SamsungLegacyClient` + `SamsungPacketEncoder`) → хранилище IP (`IpStorage`). Никаких сторонних зависимостей кроме AndroidX/Compose.

**Tech Stack:** Kotlin 1.9, Android Gradle Plugin 8.2, Jetpack Compose Material3, minSdk 26, targetSdk 34, JDK 17, AndroidX ViewModel + Lifecycle + DataStore.

**Spec:** [docs/superpowers/specs/2026-04-21-samsung-tv-remote-design.md](../specs/2026-04-21-samsung-tv-remote-design.md)

---

## File Structure

```
samsung-tv-remote/
├── .github/workflows/
│   ├── build.yml              # Debug APK on push to main
│   └── release.yml            # Signed release APK on tag v*
├── .gitignore
├── LICENSE                    # MIT
├── README.md                  # Инструкция по установке
├── build.gradle.kts           # Root
├── settings.gradle.kts
├── gradle.properties
├── gradle/wrapper/
│   ├── gradle-wrapper.jar
│   └── gradle-wrapper.properties
├── gradlew, gradlew.bat
└── app/
    ├── build.gradle.kts
    ├── proguard-rules.pro
    └── src/
        ├── main/
        │   ├── AndroidManifest.xml
        │   ├── res/
        │   │   ├── values/colors.xml
        │   │   ├── values/strings.xml
        │   │   ├── values/themes.xml
        │   │   ├── xml/network_security_config.xml
        │   │   └── mipmap-*/ic_launcher.png (generated)
        │   └── java/com/maxxleon/samsungremote/
        │       ├── MainActivity.kt
        │       ├── net/
        │       │   ├── KeyCode.kt          # enum с кодами кнопок
        │       │   ├── SamsungPacketEncoder.kt
        │       │   └── SamsungLegacyClient.kt
        │       ├── data/
        │       │   ├── IpValidator.kt
        │       │   └── IpStorage.kt
        │       ├── ui/
        │       │   ├── RemoteController.kt  # ViewModel
        │       │   ├── ConnectionState.kt
        │       │   ├── RemoteScreen.kt
        │       │   ├── SetupScreen.kt
        │       │   ├── SettingsScreen.kt
        │       │   └── theme/
        │       │       ├── Color.kt
        │       │       ├── Type.kt
        │       │       └── Theme.kt
        │       └── util/Haptics.kt
        └── test/java/com/maxxleon/samsungremote/
            ├── net/
            │   ├── SamsungPacketEncoderTest.kt
            │   └── SamsungLegacyClientTest.kt
            ├── data/IpValidatorTest.kt
            └── ui/RemoteControllerTest.kt
```

---

## Phase 1 — Repository and Skeleton

### Task 1: Создать репо и Gradle-скелет

**Files:**
- Create: `settings.gradle.kts`
- Create: `build.gradle.kts`
- Create: `gradle.properties`
- Create: `app/build.gradle.kts`
- Create: `.gitignore`

- [ ] **Step 1: Создать пустой GitHub-репо**

В браузере: https://github.com/new → name `samsung-tv-remote`, public, без README/lic (создадим сами). Клонировать локально:

```bash
cd c:/Users/DEXP/Documents/Projects
gh repo create maxxleon84-png/samsung-tv-remote --public --clone
cd samsung-tv-remote
```

- [ ] **Step 2: Инициализировать Gradle wrapper**

Запустить из любой существующей Gradle-инсталляции либо скачать wrapper напрямую:

```bash
curl -L https://services.gradle.org/distributions/gradle-8.7-bin.zip -o gradle.zip
unzip -q gradle.zip
./gradle-8.7/bin/gradle wrapper --gradle-version 8.7
rm -rf gradle-8.7 gradle.zip
```

Это создаст `gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar`, `gradle/wrapper/gradle-wrapper.properties`.

- [ ] **Step 3: Написать `settings.gradle.kts`**

```kotlin
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "samsung-tv-remote"
include(":app")
```

- [ ] **Step 4: Написать корневой `build.gradle.kts`**

```kotlin
plugins {
    id("com.android.application") version "8.2.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
}
```

- [ ] **Step 5: Написать `gradle.properties`**

```properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
```

- [ ] **Step 6: Написать `app/build.gradle.kts`**

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.maxxleon.samsungremote"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.maxxleon.samsungremote"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions { jvmTarget = "17" }

    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.8" }

    packaging {
        resources { excludes += "/META-INF/{AL2.0,LGPL2.1}" }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.02.00")
    implementation(composeBom)
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.datastore:datastore-preferences:1.0.0")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("app.cash.turbine:turbine:1.0.0")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

- [ ] **Step 7: Написать `.gitignore`**

```
*.iml
.gradle
/local.properties
/.idea
.DS_Store
/build
/captures
.externalNativeBuild
.cxx
*.apk
*.aab
*.keystore
*.jks
/app/build/
/app/release/
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: initial Gradle skeleton (Kotlin + Compose)"
```

---

### Task 2: AndroidManifest + network security config + заглушка MainActivity

**Files:**
- Create: `app/src/main/AndroidManifest.xml`
- Create: `app/src/main/res/xml/network_security_config.xml`
- Create: `app/src/main/res/values/strings.xml`
- Create: `app/src/main/res/values/colors.xml`
- Create: `app/src/main/res/values/themes.xml`
- Create: `app/src/main/java/com/maxxleon/samsungremote/MainActivity.kt`

- [ ] **Step 1: Написать `AndroidManifest.xml`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:label="@string/app_name"
        android:networkSecurityConfig="@xml/network_security_config"
        android:supportsRtl="true"
        android:theme="@style/Theme.SamsungRemote">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="@string/app_name"
            android:theme="@style/Theme.SamsungRemote">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

- [ ] **Step 2: Написать `network_security_config.xml`**

Разрешаем cleartext TCP только к локальным подсетям. В интернет ничего не уйдёт.

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">192.168.0.0/16</domain>
        <domain includeSubdomains="false">10.0.0.0/8</domain>
        <domain includeSubdomains="false">172.16.0.0/12</domain>
    </domain-config>
    <base-config cleartextTrafficPermitted="false" />
</network-security-config>
```

- [ ] **Step 3: Написать `strings.xml`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Пульт Samsung</string>
    <string name="setup_title">Подключим твой Samsung TV</string>
    <string name="setup_hint">На ТВ → Меню → Сеть → Состояние сети → IP-адрес</string>
    <string name="setup_ip_label">IP-адрес телевизора</string>
    <string name="setup_connect">Подключить</string>
    <string name="setup_waiting">Подтверди подключение на телевизоре</string>
    <string name="status_connected">подключён</string>
    <string name="status_connecting">подключаемся</string>
    <string name="status_error">ошибка</string>
    <string name="error_tv_offline">ТВ не отвечает. Проверь, что ТВ включён и в той же Wi-Fi.</string>
    <string name="error_denied">Доступ запрещён. Сбросить и попробовать заново?</string>
    <string name="retry">Повторить</string>
    <string name="settings_change_ip">Сменить IP</string>
    <string name="settings_reconnect">Переподключиться</string>
    <string name="settings_about">О приложении</string>
</resources>
```

- [ ] **Step 4: Написать заглушку `colors.xml` и `themes.xml`**

`colors.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="brand_bg">#FF070D1F</color>
    <color name="brand_surface">#FF0D1B3E</color>
    <color name="brand_border">#FF1A3A6B</color>
    <color name="brand_primary">#FF0077FF</color>
    <color name="brand_accent">#FF00D4FF</color>
</resources>
```

`themes.xml` (минимум для Activity, сам UI пойдёт через Compose):

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.SamsungRemote" parent="android:Theme.Material.NoActionBar">
        <item name="android:statusBarColor">@color/brand_bg</item>
        <item name="android:navigationBarColor">@color/brand_bg</item>
        <item name="android:windowLightStatusBar">false</item>
    </style>
</resources>
```

- [ ] **Step 5: Заглушка `MainActivity.kt`**

```kotlin
package com.maxxleon.samsungremote

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            Surface(modifier = Modifier.fillMaxSize()) {
                Text("Samsung Remote — stub")
            }
        }
    }
}
```

- [ ] **Step 6: Собрать debug APK локально (опционально) или проверить Gradle sync**

```bash
./gradlew assembleDebug --no-daemon
```

Ожидается: BUILD SUCCESSFUL. Если Android SDK не установлен — пропустить, CI соберёт на своей стороне позже.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: manifest, network security config, stub activity"
```

---

### Task 3: Цветовая тема Compose

**Files:**
- Create: `app/src/main/java/com/maxxleon/samsungremote/ui/theme/Color.kt`
- Create: `app/src/main/java/com/maxxleon/samsungremote/ui/theme/Type.kt`
- Create: `app/src/main/java/com/maxxleon/samsungremote/ui/theme/Theme.kt`

- [ ] **Step 1: `Color.kt`**

```kotlin
package com.maxxleon.samsungremote.ui.theme

import androidx.compose.ui.graphics.Color

val BrandBg        = Color(0xFF070D1F)
val BrandSurface   = Color(0xFF0D1B3E)
val BrandBorder    = Color(0xFF1A3A6B)
val BrandPrimary   = Color(0xFF0077FF)
val BrandAccent    = Color(0xFF00D4FF)
val BrandText      = Color(0xFFFFFFFF)
val BrandTextMuted = Color(0xFF8A9BC7)

val StatusOk       = Color(0xFF4ADE80)
val StatusWarn     = Color(0xFFFBBF24)
val StatusError    = Color(0xFFEF4444)
```

- [ ] **Step 2: `Type.kt`**

Используем системный шрифт на v1.0, шрифтовые файлы оставим на полировку.

```kotlin
package com.maxxleon.samsungremote.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val AppTypography = Typography(
    titleLarge = TextStyle(fontWeight = FontWeight.Bold, fontSize = 22.sp),
    titleMedium = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 18.sp),
    bodyLarge = TextStyle(fontWeight = FontWeight.Normal, fontSize = 16.sp),
    bodyMedium = TextStyle(fontWeight = FontWeight.Normal, fontSize = 14.sp),
    labelLarge = TextStyle(fontWeight = FontWeight.Bold, fontSize = 14.sp, letterSpacing = 0.5.sp)
)
```

- [ ] **Step 3: `Theme.kt`**

```kotlin
package com.maxxleon.samsungremote.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkScheme = darkColorScheme(
    background = BrandBg,
    surface = BrandSurface,
    primary = BrandPrimary,
    secondary = BrandAccent,
    onBackground = BrandText,
    onSurface = BrandText,
    onPrimary = BrandText
)

@Composable
fun SamsungRemoteTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkScheme,
        typography = AppTypography,
        content = content
    )
}
```

- [ ] **Step 4: Обновить `MainActivity.kt` — обернуть в тему**

```kotlin
package com.maxxleon.samsungremote

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import com.maxxleon.samsungremote.ui.theme.SamsungRemoteTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SamsungRemoteTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    Text("Samsung Remote — stub")
                }
            }
        }
    }
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: brand dark theme for Compose"
```

---

## Phase 2 — Core Logic (TDD)

### Task 4: `KeyCode` enum

**Files:**
- Create: `app/src/main/java/com/maxxleon/samsungremote/net/KeyCode.kt`

- [ ] **Step 1: Написать `KeyCode.kt`**

Все коды из спеки MVP. Значения — строки, которые ТВ ожидает в base64 внутри пакета.

```kotlin
package com.maxxleon.samsungremote.net

enum class KeyCode(val samsungName: String) {
    POWER("KEY_POWEROFF"),
    SOURCE("KEY_SOURCE"),
    MUTE("KEY_MUTE"),

    VOLUME_UP("KEY_VOLUP"),
    VOLUME_DOWN("KEY_VOLDOWN"),
    CHANNEL_UP("KEY_CHUP"),
    CHANNEL_DOWN("KEY_CHDOWN"),

    UP("KEY_UP"),
    DOWN("KEY_DOWN"),
    LEFT("KEY_LEFT"),
    RIGHT("KEY_RIGHT"),
    OK("KEY_ENTER"),

    BACK("KEY_RETURN"),
    HOME("KEY_HOME"),
    EXIT("KEY_EXIT"),

    NUM_0("KEY_0"),
    NUM_1("KEY_1"),
    NUM_2("KEY_2"),
    NUM_3("KEY_3"),
    NUM_4("KEY_4"),
    NUM_5("KEY_5"),
    NUM_6("KEY_6"),
    NUM_7("KEY_7"),
    NUM_8("KEY_8"),
    NUM_9("KEY_9")
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/main/java/com/maxxleon/samsungremote/net/KeyCode.kt
git commit -m "feat: KeyCode enum for MVP button set"
```

---

### Task 5: `IpValidator` (TDD)

**Files:**
- Create: `app/src/test/java/com/maxxleon/samsungremote/data/IpValidatorTest.kt`
- Create: `app/src/main/java/com/maxxleon/samsungremote/data/IpValidator.kt`

- [ ] **Step 1: Написать падающий тест**

`app/src/test/java/com/maxxleon/samsungremote/data/IpValidatorTest.kt`:

```kotlin
package com.maxxleon.samsungremote.data

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class IpValidatorTest {

    @Test fun `accepts typical home subnets`() {
        assertTrue(IpValidator.isValid("192.168.1.10"))
        assertTrue(IpValidator.isValid("10.0.0.1"))
        assertTrue(IpValidator.isValid("172.16.5.20"))
    }

    @Test fun `accepts boundary octets`() {
        assertTrue(IpValidator.isValid("0.0.0.0"))
        assertTrue(IpValidator.isValid("255.255.255.255"))
    }

    @Test fun `rejects out of range octet`() {
        assertFalse(IpValidator.isValid("192.168.1.256"))
        assertFalse(IpValidator.isValid("999.1.1.1"))
    }

    @Test fun `rejects wrong segment count`() {
        assertFalse(IpValidator.isValid("192.168.1"))
        assertFalse(IpValidator.isValid("192.168.1.1.1"))
    }

    @Test fun `rejects non-numeric`() {
        assertFalse(IpValidator.isValid("abc.def.ghi.jkl"))
        assertFalse(IpValidator.isValid(""))
        assertFalse(IpValidator.isValid("   "))
    }

    @Test fun `rejects leading zeros`() {
        // "01" is ambiguous; reject for safety
        assertFalse(IpValidator.isValid("192.168.001.1"))
    }
}
```

- [ ] **Step 2: Запустить тест, убедиться что падает**

```bash
./gradlew :app:testDebugUnitTest --tests "*.IpValidatorTest" --no-daemon
```

Ожидается: FAIL с `Unresolved reference: IpValidator`.

- [ ] **Step 3: Минимальная реализация**

`app/src/main/java/com/maxxleon/samsungremote/data/IpValidator.kt`:

```kotlin
package com.maxxleon.samsungremote.data

object IpValidator {
    fun isValid(input: String): Boolean {
        val parts = input.split(".")
        if (parts.size != 4) return false
        return parts.all { part ->
            if (part.isEmpty() || part.length > 3) return@all false
            if (part.length > 1 && part[0] == '0') return@all false
            val n = part.toIntOrNull() ?: return@all false
            n in 0..255
        }
    }
}
```

- [ ] **Step 4: Запустить тест, убедиться что проходит**

```bash
./gradlew :app:testDebugUnitTest --tests "*.IpValidatorTest" --no-daemon
```

Ожидается: BUILD SUCCESSFUL, 6 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add app/src/main/java/com/maxxleon/samsungremote/data/IpValidator.kt app/src/test/java/com/maxxleon/samsungremote/data/IpValidatorTest.kt
git commit -m "feat: IpValidator with TDD coverage"
```

---

### Task 6: `SamsungPacketEncoder` — auth-пакет (TDD)

Это критический шаг. Если байты не совпадут с эталоном — ТВ не ответит. Формат взят из [samsungctl/upnp.py](https://github.com/Ape/samsungctl/blob/master/samsungctl/remote_legacy.py).

**Files:**
- Create: `app/src/test/java/com/maxxleon/samsungremote/net/SamsungPacketEncoderTest.kt`
- Create: `app/src/main/java/com/maxxleon/samsungremote/net/SamsungPacketEncoder.kt`

**Формула авторизационного пакета:**

```
APP_STRING = "iphone..iapp.samsung"   (raw, без base64)

payload = 0x64 0x00 +
          len16LE(b64(ip))   + b64(ip) +
          len16LE(b64(mac))  + b64(mac) +
          len16LE(b64(name)) + b64(name)

packet  = 0x00 +
          len16LE(APP_STRING_bytes)  + APP_STRING_bytes +
          len16LE(payload)           + payload
```

где `len16LE(x)` — 2 байта little-endian длины массива x.

- [ ] **Step 1: Написать падающий тест**

Используем детерминированный вход и эталонный байт-выход, посчитанный вручную по формуле.

Вход:
- ip = `"192.168.1.10"` → base64 `"MTkyLjE2OC4xLjEw"` (16 байт)
- mac = `"AA:BB:CC:DD:EE:FF"` → base64 `"QUE6QkI6Q0M6REQ6RUU6RkY="` (24 байта)
- name = `"Remote"` → base64 `"UmVtb3Rl"` (8 байт)

payload:
- `0x64 0x00` (2 байта)
- `0x10 0x00` + 16 байт b64(ip) (18)
- `0x18 0x00` + 24 байта b64(mac) (26)
- `0x08 0x00` + 8 байт b64(name) (10)
- итого payload length = 2+18+26+10 = **56** → `0x38 0x00`

APP_STRING = `"iphone..iapp.samsung"` = 20 байт → `0x14 0x00`

packet:
- `0x00`
- `0x14 0x00` + 20 байт APP_STRING
- `0x38 0x00` + 56 байт payload
- итого длина packet = 1 + 2 + 20 + 2 + 56 = **81 байт**

`app/src/test/java/com/maxxleon/samsungremote/net/SamsungPacketEncoderTest.kt`:

```kotlin
package com.maxxleon.samsungremote.net

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Test

class SamsungPacketEncoderTest {

    @Test fun `auth packet total length matches formula`() {
        val bytes = SamsungPacketEncoder.authPacket(
            ip = "192.168.1.10",
            mac = "AA:BB:CC:DD:EE:FF",
            remoteName = "Remote"
        )
        assertEquals(81, bytes.size)
    }

    @Test fun `auth packet starts with 0x00 header`() {
        val bytes = SamsungPacketEncoder.authPacket(
            ip = "192.168.1.10",
            mac = "AA:BB:CC:DD:EE:FF",
            remoteName = "Remote"
        )
        assertEquals(0x00.toByte(), bytes[0])
    }

    @Test fun `auth packet contains app string at expected offset`() {
        val bytes = SamsungPacketEncoder.authPacket(
            ip = "192.168.1.10",
            mac = "AA:BB:CC:DD:EE:FF",
            remoteName = "Remote"
        )
        // после 1 байта заголовка + 2 байта длины
        val appString = String(bytes, 3, 20, Charsets.US_ASCII)
        assertEquals("iphone..iapp.samsung", appString)
    }

    @Test fun `auth packet matches full reference bytes`() {
        val bytes = SamsungPacketEncoder.authPacket(
            ip = "192.168.1.10",
            mac = "AA:BB:CC:DD:EE:FF",
            remoteName = "Remote"
        )
        val expected = byteArrayOf(
            0x00,
            // len16LE(20) + "iphone..iapp.samsung"
            0x14, 0x00,
            0x69, 0x70, 0x68, 0x6F, 0x6E, 0x65, 0x2E, 0x2E,
            0x69, 0x61, 0x70, 0x70, 0x2E, 0x73, 0x61, 0x6D,
            0x73, 0x75, 0x6E, 0x67,
            // len16LE(56) payload
            0x38, 0x00,
            0x64, 0x00,
            // len16LE(16) + b64("192.168.1.10") = "MTkyLjE2OC4xLjEw"
            0x10, 0x00,
            0x4D, 0x54, 0x6B, 0x79, 0x4C, 0x6A, 0x45, 0x32,
            0x4F, 0x43, 0x34, 0x78, 0x4C, 0x6A, 0x45, 0x77,
            // len16LE(24) + b64("AA:BB:CC:DD:EE:FF") = "QUE6QkI6Q0M6REQ6RUU6RkY="
            0x18, 0x00,
            0x51, 0x55, 0x45, 0x36, 0x51, 0x6B, 0x49, 0x36,
            0x51, 0x30, 0x30, 0x36, 0x52, 0x45, 0x51, 0x36,
            0x52, 0x55, 0x55, 0x36, 0x52, 0x6B, 0x59, 0x3D,
            // len16LE(8) + b64("Remote") = "UmVtb3Rl"
            0x08, 0x00,
            0x55, 0x6D, 0x56, 0x74, 0x62, 0x33, 0x52, 0x6C
        )
        assertArrayEquals(expected, bytes)
    }
}
```

- [ ] **Step 2: Запустить тест, убедиться что падает**

```bash
./gradlew :app:testDebugUnitTest --tests "*.SamsungPacketEncoderTest" --no-daemon
```

Ожидается: FAIL с `Unresolved reference: SamsungPacketEncoder`.

- [ ] **Step 3: Минимальная реализация**

`app/src/main/java/com/maxxleon/samsungremote/net/SamsungPacketEncoder.kt`:

```kotlin
package com.maxxleon.samsungremote.net

import android.util.Base64
import java.nio.ByteBuffer
import java.nio.ByteOrder

object SamsungPacketEncoder {

    private const val APP_STRING = "iphone..iapp.samsung"

    fun authPacket(ip: String, mac: String, remoteName: String): ByteArray {
        val payload = buildPayload {
            putByte(0x64); putByte(0x00)
            putB64String(ip)
            putB64String(mac)
            putB64String(remoteName)
        }
        return wrapPacket(payload)
    }

    fun keyPacket(key: KeyCode): ByteArray {
        val payload = buildPayload {
            putByte(0x00); putByte(0x00); putByte(0x00)
            putB64String(key.samsungName)
        }
        return wrapPacket(payload)
    }

    private fun wrapPacket(payload: ByteArray): ByteArray {
        val appBytes = APP_STRING.toByteArray(Charsets.US_ASCII)
        val buf = ByteBuffer.allocate(1 + 2 + appBytes.size + 2 + payload.size)
            .order(ByteOrder.LITTLE_ENDIAN)
        buf.put(0x00.toByte())
        buf.putShort(appBytes.size.toShort())
        buf.put(appBytes)
        buf.putShort(payload.size.toShort())
        buf.put(payload)
        return buf.array()
    }

    private class PayloadBuilder {
        private val out = java.io.ByteArrayOutputStream()
        fun putByte(b: Int) { out.write(b) }
        fun putB64String(s: String) {
            val b64 = Base64.encode(s.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
            out.write(b64.size and 0xFF)
            out.write((b64.size shr 8) and 0xFF)
            out.write(b64)
        }
        fun build(): ByteArray = out.toByteArray()
    }

    private inline fun buildPayload(block: PayloadBuilder.() -> Unit): ByteArray =
        PayloadBuilder().apply(block).build()
}
```

Внимание: `android.util.Base64` — это Android API, в unit-тестах JVM он не работает без робо-эмуляции. Заменим на `java.util.Base64` во избежание зависимости от Android Framework в тестах.

- [ ] **Step 4: Переписать на `java.util.Base64` для чистых JVM-тестов**

```kotlin
package com.maxxleon.samsungremote.net

import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.Base64 as JavaBase64

object SamsungPacketEncoder {

    private const val APP_STRING = "iphone..iapp.samsung"

    fun authPacket(ip: String, mac: String, remoteName: String): ByteArray {
        val payload = buildPayload {
            putByte(0x64); putByte(0x00)
            putB64String(ip)
            putB64String(mac)
            putB64String(remoteName)
        }
        return wrapPacket(payload)
    }

    fun keyPacket(key: KeyCode): ByteArray {
        val payload = buildPayload {
            putByte(0x00); putByte(0x00); putByte(0x00)
            putB64String(key.samsungName)
        }
        return wrapPacket(payload)
    }

    private fun wrapPacket(payload: ByteArray): ByteArray {
        val appBytes = APP_STRING.toByteArray(Charsets.US_ASCII)
        val buf = ByteBuffer.allocate(1 + 2 + appBytes.size + 2 + payload.size)
            .order(ByteOrder.LITTLE_ENDIAN)
        buf.put(0x00.toByte())
        buf.putShort(appBytes.size.toShort())
        buf.put(appBytes)
        buf.putShort(payload.size.toShort())
        buf.put(payload)
        return buf.array()
    }

    private class PayloadBuilder {
        private val out = java.io.ByteArrayOutputStream()
        fun putByte(b: Int) { out.write(b) }
        fun putB64String(s: String) {
            val b64 = JavaBase64.getEncoder().encode(s.toByteArray(Charsets.UTF_8))
            out.write(b64.size and 0xFF)
            out.write((b64.size shr 8) and 0xFF)
            out.write(b64)
        }
        fun build(): ByteArray = out.toByteArray()
    }

    private inline fun buildPayload(block: PayloadBuilder.() -> Unit): ByteArray =
        PayloadBuilder().apply(block).build()
}
```

- [ ] **Step 5: Запустить тест, убедиться что проходит**

```bash
./gradlew :app:testDebugUnitTest --tests "*.SamsungPacketEncoderTest" --no-daemon
```

Ожидается: 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add app/src/main/java/com/maxxleon/samsungremote/net/SamsungPacketEncoder.kt app/src/test/java/com/maxxleon/samsungremote/net/SamsungPacketEncoderTest.kt
git commit -m "feat: SamsungPacketEncoder.authPacket byte-for-byte verified"
```

---

### Task 7: `SamsungPacketEncoder` — key-пакет (TDD)

Добавляем тесты для `keyPacket()`.

- [ ] **Step 1: Добавить тест в `SamsungPacketEncoderTest.kt`**

Добавить в класс:

```kotlin
    @Test fun `key packet for VOLUME_UP matches reference bytes`() {
        val bytes = SamsungPacketEncoder.keyPacket(KeyCode.VOLUME_UP)
        // payload = 0x00 0x00 0x00 + len16LE(b64("KEY_VOLUP")) + b64("KEY_VOLUP")
        // "KEY_VOLUP" -> b64 "S0VZX1ZPTFVQ" (12 bytes)
        // payload length = 3 + 2 + 12 = 17 -> 0x11 0x00
        val expected = byteArrayOf(
            0x00,
            0x14, 0x00,
            0x69, 0x70, 0x68, 0x6F, 0x6E, 0x65, 0x2E, 0x2E,
            0x69, 0x61, 0x70, 0x70, 0x2E, 0x73, 0x61, 0x6D,
            0x73, 0x75, 0x6E, 0x67,
            0x11, 0x00,
            0x00, 0x00, 0x00,
            0x0C, 0x00,
            0x53, 0x30, 0x56, 0x5A, 0x58, 0x31, 0x5A, 0x50,
            0x54, 0x46, 0x56, 0x51
        )
        assertArrayEquals(expected, bytes)
    }

    @Test fun `key packet includes three zero bytes prefix`() {
        val bytes = SamsungPacketEncoder.keyPacket(KeyCode.OK)
        // после заголовка и app string: offset = 1 + 2 + 20 + 2 = 25
        assertEquals(0x00.toByte(), bytes[25])
        assertEquals(0x00.toByte(), bytes[26])
        assertEquals(0x00.toByte(), bytes[27])
    }

    @Test fun `every KeyCode produces non-empty packet`() {
        KeyCode.values().forEach { code ->
            val bytes = SamsungPacketEncoder.keyPacket(code)
            assert(bytes.size > 30) { "packet for $code too short: ${bytes.size}" }
        }
    }
```

- [ ] **Step 2: Запустить тест, убедиться что проходит**

Реализация уже есть (в Task 6 мы её написали целиком). Тест проверит корректность формата.

```bash
./gradlew :app:testDebugUnitTest --tests "*.SamsungPacketEncoderTest" --no-daemon
```

Ожидается: 7 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add app/src/test/java/com/maxxleon/samsungremote/net/SamsungPacketEncoderTest.kt
git commit -m "test: coverage for keyPacket byte layout"
```

---

### Task 8: `SamsungLegacyClient` — TCP-клиент (TDD с абстракцией сокета)

Реальный `Socket` не тестируется в unit — абстрагируем через интерфейс и подставим фейковый в тестах.

**Files:**
- Create: `app/src/main/java/com/maxxleon/samsungremote/net/SamsungLegacyClient.kt`
- Create: `app/src/test/java/com/maxxleon/samsungremote/net/SamsungLegacyClientTest.kt`

- [ ] **Step 1: Написать падающий тест**

```kotlin
package com.maxxleon.samsungremote.net

import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream

private class FakeTransport(
    private val responseBytes: ByteArray = byteArrayOf(0x64, 0x00, 0x00, 0x00, 0x00, 0x00)
) : Transport {
    val written = ByteArrayOutputStream()
    var connected = false
    var closed = false

    override fun connect(host: String, port: Int, timeoutMs: Int) {
        connected = true
    }
    override fun write(bytes: ByteArray) { written.write(bytes) }
    override fun read(maxBytes: Int): ByteArray {
        val take = minOf(maxBytes, responseBytes.size)
        return responseBytes.copyOf(take)
    }
    override fun close() { closed = true }
}

class SamsungLegacyClientTest {

    @Test fun `connect sends auth packet to transport`() = runTest {
        val transport = FakeTransport()
        val client = SamsungLegacyClient(
            transportFactory = { transport },
            phoneIp = "192.168.1.55",
            phoneMac = "AA:BB:CC:DD:EE:FF",
            remoteName = "Remote"
        )
        client.connect("192.168.1.10")
        assertTrue(transport.connected)
        val expectedAuth = SamsungPacketEncoder.authPacket(
            "192.168.1.55", "AA:BB:CC:DD:EE:FF", "Remote"
        )
        assertArrayEqualsByteArrays(expectedAuth, transport.written.toByteArray().copyOf(expectedAuth.size))
    }

    @Test fun `sendKey writes correct key packet`() = runTest {
        val transport = FakeTransport()
        val client = SamsungLegacyClient(
            transportFactory = { transport },
            phoneIp = "192.168.1.55",
            phoneMac = "AA:BB:CC:DD:EE:FF",
            remoteName = "Remote"
        )
        client.connect("192.168.1.10")
        transport.written.reset()
        client.sendKey(KeyCode.MUTE)
        val expected = SamsungPacketEncoder.keyPacket(KeyCode.MUTE)
        assertArrayEqualsByteArrays(expected, transport.written.toByteArray())
    }

    @Test fun `close tears down transport`() = runTest {
        val transport = FakeTransport()
        val client = SamsungLegacyClient(
            transportFactory = { transport },
            phoneIp = "192.168.1.55",
            phoneMac = "AA:BB:CC:DD:EE:FF",
            remoteName = "Remote"
        )
        client.connect("192.168.1.10")
        client.close()
        assertTrue(transport.closed)
    }

    private fun assertArrayEqualsByteArrays(expected: ByteArray, actual: ByteArray) {
        assertEquals(expected.toList(), actual.toList())
    }
}
```

- [ ] **Step 2: Запустить тест, убедиться что падает**

```bash
./gradlew :app:testDebugUnitTest --tests "*.SamsungLegacyClientTest" --no-daemon
```

Ожидается: FAIL — нет `Transport`, `SamsungLegacyClient`.

- [ ] **Step 3: Реализовать `Transport` интерфейс и `SamsungLegacyClient`**

`app/src/main/java/com/maxxleon/samsungremote/net/SamsungLegacyClient.kt`:

```kotlin
package com.maxxleon.samsungremote.net

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.Socket

interface Transport {
    fun connect(host: String, port: Int, timeoutMs: Int)
    fun write(bytes: ByteArray)
    fun read(maxBytes: Int): ByteArray
    fun close()
}

class SocketTransport : Transport {
    private var socket: Socket? = null
    private var input: InputStream? = null
    private var output: OutputStream? = null

    override fun connect(host: String, port: Int, timeoutMs: Int) {
        val s = Socket()
        s.connect(InetSocketAddress(host, port), timeoutMs)
        socket = s
        input = s.getInputStream()
        output = s.getOutputStream()
    }

    override fun write(bytes: ByteArray) {
        output?.write(bytes)
        output?.flush()
    }

    override fun read(maxBytes: Int): ByteArray {
        val buf = ByteArray(maxBytes)
        val n = input?.read(buf) ?: return ByteArray(0)
        return if (n <= 0) ByteArray(0) else buf.copyOf(n)
    }

    override fun close() {
        try { socket?.close() } catch (_: Exception) {}
        socket = null
        input = null
        output = null
    }
}

class SamsungLegacyClient(
    private val transportFactory: () -> Transport = { SocketTransport() },
    private val phoneIp: String,
    private val phoneMac: String,
    private val remoteName: String = "Remote",
    private val connectTimeoutMs: Int = 5_000
) {
    companion object { const val PORT = 55_000 }

    private var transport: Transport? = null

    suspend fun connect(tvIp: String) = withContext(Dispatchers.IO) {
        close()
        val t = transportFactory()
        t.connect(tvIp, PORT, connectTimeoutMs)
        t.write(SamsungPacketEncoder.authPacket(phoneIp, phoneMac, remoteName))
        // мы читаем ответ, но не валидируем его жёстко в v1.0 — ТВ может ответить по-разному,
        // факт успешного write + отсутствие IOException считаем признаком установки пары́.
        t.read(1024)
        transport = t
    }

    suspend fun sendKey(key: KeyCode) = withContext(Dispatchers.IO) {
        val t = transport ?: throw IllegalStateException("Not connected")
        t.write(SamsungPacketEncoder.keyPacket(key))
    }

    fun close() {
        transport?.close()
        transport = null
    }

    fun isConnected(): Boolean = transport != null
}
```

- [ ] **Step 4: Запустить тест, убедиться что проходит**

```bash
./gradlew :app:testDebugUnitTest --tests "*.SamsungLegacyClientTest" --no-daemon
```

Ожидается: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/main/java/com/maxxleon/samsungremote/net/SamsungLegacyClient.kt app/src/test/java/com/maxxleon/samsungremote/net/SamsungLegacyClientTest.kt
git commit -m "feat: SamsungLegacyClient with pluggable Transport"
```

---

## Phase 3 — State

### Task 9: `IpStorage` на DataStore Preferences

**Files:**
- Create: `app/src/main/java/com/maxxleon/samsungremote/data/IpStorage.kt`

Без unit-теста: DataStore Preferences требует Context, лучше покрыть instrumented-тестом позже. Для v1.0 тонкий фасад.

- [ ] **Step 1: Написать `IpStorage.kt`**

```kotlin
package com.maxxleon.samsungremote.data

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "samsung_remote")

class IpStorage(private val context: Context) {

    private val TV_IP = stringPreferencesKey("tv_ip")
    private val PAIRED = booleanPreferencesKey("paired")

    val tvIp: Flow<String?> = context.dataStore.data.map { it[TV_IP] }
    val paired: Flow<Boolean> = context.dataStore.data.map { it[PAIRED] ?: false }

    suspend fun setTvIp(ip: String) {
        context.dataStore.edit { it[TV_IP] = ip }
    }

    suspend fun setPaired(paired: Boolean) {
        context.dataStore.edit { it[PAIRED] = paired }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/main/java/com/maxxleon/samsungremote/data/IpStorage.kt
git commit -m "feat: IpStorage via DataStore Preferences"
```

---

### Task 10: `RemoteController` ViewModel + `ConnectionState` (TDD стейт-машины)

**Files:**
- Create: `app/src/main/java/com/maxxleon/samsungremote/ui/ConnectionState.kt`
- Create: `app/src/main/java/com/maxxleon/samsungremote/ui/RemoteController.kt`
- Create: `app/src/test/java/com/maxxleon/samsungremote/ui/RemoteControllerTest.kt`

- [ ] **Step 1: `ConnectionState.kt`**

```kotlin
package com.maxxleon.samsungremote.ui

sealed interface ConnectionState {
    data object Idle : ConnectionState
    data object Connecting : ConnectionState
    data object Connected : ConnectionState
    data class Error(val reason: String) : ConnectionState
}
```

- [ ] **Step 2: Написать падающий тест**

```kotlin
package com.maxxleon.samsungremote.ui

import app.cash.turbine.test
import com.maxxleon.samsungremote.net.KeyCode
import com.maxxleon.samsungremote.net.SamsungLegacyClient
import com.maxxleon.samsungremote.net.Transport
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.io.ByteArrayOutputStream

class RemoteControllerTest {

    private val dispatcher = StandardTestDispatcher()

    @Before fun setUp() { Dispatchers.setMain(dispatcher) }
    @After fun tearDown() { Dispatchers.resetMain() }

    private class StubTransport(var failOnConnect: Boolean = false) : Transport {
        val written = ByteArrayOutputStream()
        override fun connect(host: String, port: Int, timeoutMs: Int) {
            if (failOnConnect) throw java.net.ConnectException("refused")
        }
        override fun write(bytes: ByteArray) { written.write(bytes) }
        override fun read(maxBytes: Int) = ByteArray(0)
        override fun close() {}
    }

    private fun makeClient(transport: Transport) = SamsungLegacyClient(
        transportFactory = { transport },
        phoneIp = "192.168.1.55",
        phoneMac = "AA:BB:CC:DD:EE:FF",
        remoteName = "Remote"
    )

    @Test fun `connect transitions Idle - Connecting - Connected on success`() = runTest {
        val controller = RemoteController(makeClient(StubTransport()))
        controller.state.test {
            assertEquals(ConnectionState.Idle, awaitItem())
            controller.connect("192.168.1.10")
            assertEquals(ConnectionState.Connecting, awaitItem())
            assertEquals(ConnectionState.Connected, awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test fun `connect transitions to Error on socket failure`() = runTest {
        val controller = RemoteController(makeClient(StubTransport(failOnConnect = true)))
        controller.state.test {
            assertEquals(ConnectionState.Idle, awaitItem())
            controller.connect("192.168.1.10")
            assertEquals(ConnectionState.Connecting, awaitItem())
            val errorState = awaitItem()
            assertTrue(errorState is ConnectionState.Error)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test fun `sendKey does nothing when not connected`() = runTest {
        val transport = StubTransport()
        val controller = RemoteController(makeClient(transport))
        controller.sendKey(KeyCode.MUTE)
        assertEquals(0, transport.written.size())
    }

    @Test fun `sendKey writes bytes when connected`() = runTest {
        val transport = StubTransport()
        val controller = RemoteController(makeClient(transport))
        controller.connect("192.168.1.10")
        dispatcher.scheduler.advanceUntilIdle()
        val beforeSize = transport.written.size()
        controller.sendKey(KeyCode.MUTE)
        dispatcher.scheduler.advanceUntilIdle()
        assertTrue(transport.written.size() > beforeSize)
    }
}
```

- [ ] **Step 3: Запустить тест, убедиться что падает**

```bash
./gradlew :app:testDebugUnitTest --tests "*.RemoteControllerTest" --no-daemon
```

Ожидается: FAIL — `RemoteController` не объявлен.

- [ ] **Step 4: Реализовать `RemoteController.kt`**

```kotlin
package com.maxxleon.samsungremote.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.maxxleon.samsungremote.net.KeyCode
import com.maxxleon.samsungremote.net.SamsungLegacyClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class RemoteController(
    private val client: SamsungLegacyClient
) : ViewModel() {

    private val _state = MutableStateFlow<ConnectionState>(ConnectionState.Idle)
    val state: StateFlow<ConnectionState> = _state.asStateFlow()

    fun connect(tvIp: String) {
        viewModelScope.launch {
            _state.value = ConnectionState.Connecting
            try {
                client.connect(tvIp)
                _state.value = ConnectionState.Connected
            } catch (t: Throwable) {
                _state.value = ConnectionState.Error(t.message ?: "неизвестная ошибка")
            }
        }
    }

    fun sendKey(key: KeyCode) {
        if (_state.value !is ConnectionState.Connected) return
        viewModelScope.launch {
            try {
                client.sendKey(key)
            } catch (t: Throwable) {
                _state.value = ConnectionState.Error(t.message ?: "разрыв соединения")
            }
        }
    }

    fun disconnect() {
        client.close()
        _state.value = ConnectionState.Idle
    }

    override fun onCleared() {
        super.onCleared()
        client.close()
    }
}
```

- [ ] **Step 5: Запустить тест, убедиться что проходит**

```bash
./gradlew :app:testDebugUnitTest --tests "*.RemoteControllerTest" --no-daemon
```

Ожидается: 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add app/src/main/java/com/maxxleon/samsungremote/ui/ConnectionState.kt app/src/main/java/com/maxxleon/samsungremote/ui/RemoteController.kt app/src/test/java/com/maxxleon/samsungremote/ui/RemoteControllerTest.kt
git commit -m "feat: RemoteController with state machine coverage"
```

---

## Phase 4 — UI (Compose)

Для UI-кода тесты-скриншоты оставим на пост-MVP. Здесь проверка ручная: запуск `./gradlew assembleDebug` + визуальная проверка в Preview или на устройстве.

### Task 11: `SetupScreen`

**Files:**
- Create: `app/src/main/java/com/maxxleon/samsungremote/ui/SetupScreen.kt`

- [ ] **Step 1: Написать `SetupScreen.kt`**

```kotlin
package com.maxxleon.samsungremote.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.maxxleon.samsungremote.data.IpValidator
import com.maxxleon.samsungremote.ui.theme.SamsungRemoteTheme

@Composable
fun SetupScreen(
    initialIp: String = "",
    state: ConnectionState,
    onConnectClick: (String) -> Unit,
    onRetry: () -> Unit
) {
    var ip by remember { mutableStateOf(initialIp) }
    val isValid = IpValidator.isValid(ip)

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(48.dp))
        Text("Подключим твой Samsung TV", style = MaterialTheme.typography.titleLarge)
        Text(
            "На ТВ → Меню → Сеть → Состояние сети → IP-адрес",
            style = MaterialTheme.typography.bodyMedium
        )
        OutlinedTextField(
            value = ip,
            onValueChange = { ip = it.trim() },
            label = { Text("IP-адрес телевизора") },
            singleLine = true,
            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                keyboardType = KeyboardType.Number
            ),
            modifier = Modifier.fillMaxWidth()
        )
        Button(
            onClick = { onConnectClick(ip) },
            enabled = isValid && state !is ConnectionState.Connecting,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Подключить")
        }
        when (state) {
            ConnectionState.Connecting -> {
                CircularProgressIndicator()
                Text("Подтверди подключение на телевизоре")
            }
            is ConnectionState.Error -> {
                Text("Ошибка: ${state.reason}")
                OutlinedButton(onClick = onRetry) { Text("Повторить") }
            }
            else -> Unit
        }
    }
}

@Preview @Composable
private fun SetupScreenPreview() {
    SamsungRemoteTheme {
        SetupScreen(state = ConnectionState.Idle, onConnectClick = {}, onRetry = {})
    }
}
```

- [ ] **Step 2: Собрать debug APK локально (или пропустить, CI соберёт)**

```bash
./gradlew assembleDebug --no-daemon
```

- [ ] **Step 3: Commit**

```bash
git add app/src/main/java/com/maxxleon/samsungremote/ui/SetupScreen.kt
git commit -m "feat: SetupScreen with IP validation and pairing feedback"
```

---

### Task 12: `RemoteScreen` (центральный экран пульта)

**Files:**
- Create: `app/src/main/java/com/maxxleon/samsungremote/util/Haptics.kt`
- Create: `app/src/main/java/com/maxxleon/samsungremote/ui/RemoteScreen.kt`

- [ ] **Step 1: Haptic feedback helper**

```kotlin
package com.maxxleon.samsungremote.util

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

fun tick(context: Context, millis: Long = 30) {
    val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
        manager.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }
    vibrator.vibrate(VibrationEffect.createOneShot(millis, VibrationEffect.DEFAULT_AMPLITUDE))
}
```

- [ ] **Step 2: Написать `RemoteScreen.kt`**

Длинно, но скелет по раскладке из спеки. Если хочется — полировку кнопок вынести в отдельную задачу.

```kotlin
package com.maxxleon.samsungremote.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.maxxleon.samsungremote.net.KeyCode
import com.maxxleon.samsungremote.ui.theme.*
import com.maxxleon.samsungremote.util.tick

@Composable
fun RemoteScreen(
    state: ConnectionState,
    onPress: (KeyCode) -> Unit,
    onSettingsClick: () -> Unit
) {
    val ctx = LocalContext.current
    val press: (KeyCode) -> Unit = { k -> tick(ctx); onPress(k) }

    Column(
        modifier = Modifier.fillMaxSize().background(BrandBg).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        TopBar(state, onSettingsClick)
        Spacer(Modifier.height(8.dp))
        CircleButton(icon = Icons.Default.PowerSettingsNew, accent = true) { press(KeyCode.POWER) }
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
            PillButton("Source") { press(KeyCode.SOURCE) }
            PillButton("Mute", icon = Icons.Default.VolumeOff) { press(KeyCode.MUTE) }
        }
        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
            RockerColumn(
                topLabel = "Vol +", bottomLabel = "Vol −",
                onTop = { press(KeyCode.VOLUME_UP) }, onBottom = { press(KeyCode.VOLUME_DOWN) }
            )
            RockerColumn(
                topLabel = "Ch +", bottomLabel = "Ch −",
                onTop = { press(KeyCode.CHANNEL_UP) }, onBottom = { press(KeyCode.CHANNEL_DOWN) }
            )
        }
        DPad(
            onUp = { press(KeyCode.UP) },
            onDown = { press(KeyCode.DOWN) },
            onLeft = { press(KeyCode.LEFT) },
            onRight = { press(KeyCode.RIGHT) },
            onOk = { press(KeyCode.OK) }
        )
        Row(horizontalArrangement = Arrangement.SpaceEvenly, modifier = Modifier.fillMaxWidth()) {
            PillButton("Back") { press(KeyCode.BACK) }
            PillButton("Home") { press(KeyCode.HOME) }
            PillButton("Exit") { press(KeyCode.EXIT) }
        }
        NumberGrid(onDigit = { d -> press(digitToKey(d)) })
    }
}

@Composable
private fun TopBar(state: ConnectionState, onSettings: () -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
        val (dotColor, label) = when (state) {
            ConnectionState.Connected -> StatusOk to "подключён"
            ConnectionState.Connecting -> StatusWarn to "подключаемся"
            is ConnectionState.Error -> StatusError to "ошибка"
            ConnectionState.Idle -> BrandTextMuted to "не подключён"
        }
        Box(Modifier.size(10.dp).clip(CircleShape).background(dotColor))
        Spacer(Modifier.width(8.dp))
        Text(label, color = BrandText)
        Spacer(Modifier.weight(1f))
        IconButton(onClick = onSettings) {
            Icon(Icons.Default.Settings, contentDescription = "Настройки", tint = BrandText)
        }
    }
}

@Composable
private fun CircleButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    accent: Boolean = false,
    onClick: () -> Unit
) {
    val border = if (accent) BrandAccent else BrandBorder
    Box(
        modifier = Modifier
            .size(80.dp)
            .clip(CircleShape)
            .background(BrandSurface)
            .border(2.dp, border, CircleShape),
        contentAlignment = Alignment.Center
    ) {
        IconButton(onClick = onClick) {
            Icon(icon, contentDescription = null, tint = BrandText)
        }
    }
}

@Composable
private fun PillButton(
    text: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector? = null,
    onClick: () -> Unit
) {
    OutlinedButton(
        onClick = onClick,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, BrandBorder),
        colors = ButtonDefaults.outlinedButtonColors(containerColor = BrandSurface, contentColor = BrandText)
    ) {
        if (icon != null) {
            Icon(icon, contentDescription = null)
            Spacer(Modifier.width(4.dp))
        }
        Text(text)
    }
}

@Composable
private fun RockerColumn(topLabel: String, bottomLabel: String, onTop: () -> Unit, onBottom: () -> Unit) {
    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        PillButton(topLabel, onClick = onTop)
        PillButton(bottomLabel, onClick = onBottom)
    }
}

@Composable
private fun DPad(
    onUp: () -> Unit, onDown: () -> Unit, onLeft: () -> Unit,
    onRight: () -> Unit, onOk: () -> Unit
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        PillButton("▲", onClick = onUp)
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            PillButton("◀", onClick = onLeft)
            CircleButton(icon = Icons.Default.Check, accent = true, onClick = onOk)
            PillButton("▶", onClick = onRight)
        }
        PillButton("▼", onClick = onDown)
    }
}

@Composable
private fun NumberGrid(onDigit: (Int) -> Unit) {
    val rows = listOf(
        listOf(1, 2, 3),
        listOf(4, 5, 6),
        listOf(7, 8, 9)
    )
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        rows.forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { digit ->
                    PillButton(digit.toString(), onClick = { onDigit(digit) })
                }
            }
        }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
            PillButton("0", onClick = { onDigit(0) })
        }
    }
}

private fun digitToKey(d: Int): KeyCode = when (d) {
    0 -> KeyCode.NUM_0; 1 -> KeyCode.NUM_1; 2 -> KeyCode.NUM_2
    3 -> KeyCode.NUM_3; 4 -> KeyCode.NUM_4; 5 -> KeyCode.NUM_5
    6 -> KeyCode.NUM_6; 7 -> KeyCode.NUM_7; 8 -> KeyCode.NUM_8
    9 -> KeyCode.NUM_9
    else -> error("invalid digit $d")
}

@Preview @Composable
private fun RemoteScreenPreview() {
    SamsungRemoteTheme {
        RemoteScreen(state = ConnectionState.Connected, onPress = {}, onSettingsClick = {})
    }
}
```

- [ ] **Step 3: Проверить сборку**

```bash
./gradlew assembleDebug --no-daemon
```

Ожидается: BUILD SUCCESSFUL.

- [ ] **Step 4: Commit**

```bash
git add app/src/main/java/com/maxxleon/samsungremote/ui/RemoteScreen.kt app/src/main/java/com/maxxleon/samsungremote/util/Haptics.kt
git commit -m "feat: RemoteScreen layout with D-pad, volume, channels, digits"
```

---

### Task 13: `SettingsScreen`

**Files:**
- Create: `app/src/main/java/com/maxxleon/samsungremote/ui/SettingsScreen.kt`

- [ ] **Step 1: Написать `SettingsScreen.kt`**

```kotlin
package com.maxxleon.samsungremote.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.unit.dp

@Composable
fun SettingsScreen(
    currentIp: String?,
    onChangeIp: () -> Unit,
    onReconnect: () -> Unit,
    onBack: () -> Unit
) {
    val uri = LocalUriHandler.current
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        TopAppBar(
            title = { Text("Настройки") },
            navigationIcon = { IconButton(onClick = onBack) { Text("←") } }
        )
        Text("IP телевизора: ${currentIp ?: "—"}", style = MaterialTheme.typography.bodyLarge)
        Button(onClick = onChangeIp, modifier = Modifier.fillMaxWidth()) { Text("Сменить IP") }
        Button(onClick = onReconnect, modifier = Modifier.fillMaxWidth()) { Text("Переподключиться") }
        Spacer(Modifier.height(24.dp))
        Text("О приложении", style = MaterialTheme.typography.titleMedium)
        Text("Samsung Remote v1.0.0 — мой пульт на Kotlin за вечер.")
        TextButton(onClick = { uri.openUri("https://t.me/my_way_in_wibecoding") }) {
            Text("Канал @my_way_in_wibecoding")
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/main/java/com/maxxleon/samsungremote/ui/SettingsScreen.kt
git commit -m "feat: SettingsScreen with IP/reconnect/about"
```

---

### Task 14: Навигация + `MainActivity`

**Files:**
- Modify: `app/src/main/java/com/maxxleon/samsungremote/MainActivity.kt`

Простая навигация без NavController — ручное переключение экранов по state. YAGNI.

- [ ] **Step 1: Переписать `MainActivity.kt`**

```kotlin
package com.maxxleon.samsungremote

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.lifecycle.viewmodel.initializer
import com.maxxleon.samsungremote.data.IpStorage
import com.maxxleon.samsungremote.net.SamsungLegacyClient
import com.maxxleon.samsungremote.ui.*
import com.maxxleon.samsungremote.ui.theme.SamsungRemoteTheme
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var ipStorage: IpStorage

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ipStorage = IpStorage(applicationContext)

        val phoneIp = "192.168.1.55"   // v1.1: определять автоматически через ConnectivityManager
        val phoneMac = "FF:FF:FF:FF:FF:FF"  // реальный MAC недоступен на Android 6+, фейковый ОК
        val client = SamsungLegacyClient(
            phoneIp = phoneIp,
            phoneMac = phoneMac,
            remoteName = "Мой пульт"
        )

        val factory = viewModelFactory {
            initializer { RemoteController(client) }
        }

        setContent {
            SamsungRemoteTheme {
                val controller: RemoteController = viewModel(factory = factory)
                val state by controller.state.collectAsState()
                val savedIp by ipStorage.tvIp.collectAsState(initial = null)
                val paired by ipStorage.paired.collectAsState(initial = false)

                var screen by remember { mutableStateOf<Screen>(Screen.Loading) }

                LaunchedEffect(savedIp, paired) {
                    val ip = savedIp
                    screen = when {
                        ip == null || !paired -> Screen.Setup
                        else -> {
                            controller.connect(ip)
                            Screen.Remote
                        }
                    }
                }

                Surface(modifier = Modifier.fillMaxSize()) {
                    when (val s = screen) {
                        Screen.Loading -> Unit
                        Screen.Setup -> SetupScreen(
                            initialIp = savedIp ?: "",
                            state = state,
                            onConnectClick = { ip ->
                                controller.connect(ip)
                                // при успехе сохраняем и идём в Remote
                                this@MainActivity.lifecycleScope.launch {
                                    controller.state.collect { st ->
                                        if (st is ConnectionState.Connected) {
                                            ipStorage.setTvIp(ip)
                                            ipStorage.setPaired(true)
                                            screen = Screen.Remote
                                            return@collect
                                        }
                                    }
                                }
                            },
                            onRetry = {
                                savedIp?.let { controller.connect(it) }
                            }
                        )
                        Screen.Remote -> RemoteScreen(
                            state = state,
                            onPress = controller::sendKey,
                            onSettingsClick = { screen = Screen.Settings }
                        )
                        Screen.Settings -> SettingsScreen(
                            currentIp = savedIp,
                            onChangeIp = {
                                this@MainActivity.lifecycleScope.launch {
                                    ipStorage.clear()
                                    controller.disconnect()
                                    screen = Screen.Setup
                                }
                            },
                            onReconnect = { savedIp?.let { controller.connect(it) } },
                            onBack = { screen = Screen.Remote }
                        )
                    }
                }
            }
        }
    }
}

private sealed interface Screen {
    data object Loading : Screen
    data object Setup : Screen
    data object Remote : Screen
    data object Settings : Screen
}
```

Заметка: использование `lifecycleScope` требует импорта `androidx.lifecycle.lifecycleScope`. Кроме того, логика «дожидаемся Connected и сохраняем» упрощена — для чистоты выносится в ViewModel в v1.1, сейчас годится.

- [ ] **Step 2: Собрать APK, если есть SDK локально**

```bash
./gradlew assembleDebug --no-daemon
```

- [ ] **Step 3: Commit**

```bash
git add app/src/main/java/com/maxxleon/samsungremote/MainActivity.kt
git commit -m "feat: wire screens together with simple state-based navigation"
```

---

## Phase 5 — CI and Release

### Task 15: GitHub Actions — debug build on every push

**Files:**
- Create: `.github/workflows/build.yml`

- [ ] **Step 1: Написать workflow**

```yaml
name: Build Debug APK

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Cache Gradle
        uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: gradle-${{ hashFiles('**/*.gradle.kts', 'gradle/wrapper/gradle-wrapper.properties') }}

      - name: Run unit tests
        run: ./gradlew test --no-daemon

      - name: Build debug APK
        run: ./gradlew assembleDebug --no-daemon

      - uses: actions/upload-artifact@v4
        with:
          name: samsung-remote-debug
          path: app/build/outputs/apk/debug/app-debug.apk
          retention-days: 90
```

- [ ] **Step 2: Commit и пуш, чтобы CI прогнал**

```bash
git add .github/workflows/build.yml
git commit -m "ci: debug build + unit tests on every push"
git push -u origin main
```

- [ ] **Step 3: Проверить зелёный прогон**

Открыть https://github.com/maxxleon84-png/samsung-tv-remote/actions — должен быть зелёный билд. Скачать APK из артефактов, поставить на Realme, запустить.

Ожидается: приложение открывается, показывает SetupScreen. Сетевые операции пока не тестируем — это ручная проверка после Task 17.

---

### Task 16: GitHub Actions — release APK на тег

**Files:**
- Create: `.github/workflows/release.yml`

Требует keystore. Шаги по подготовке до workflow:

- [ ] **Step 1: Сгенерировать release keystore локально**

```bash
keytool -genkey -v -keystore release.keystore -alias samsung-remote \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass CHANGE_ME_STRONG -keypass CHANGE_ME_STRONG \
  -dname "CN=Maxim Leonidov, O=maxxleon, C=RU"
```

Пароли сохранить в 1Password / KeePass. `release.keystore` НЕ коммитить (уже в .gitignore).

- [ ] **Step 2: Закодировать keystore в base64 для Secrets**

```bash
base64 -w 0 release.keystore > keystore.b64
cat keystore.b64   # скопировать всё содержимое
```

- [ ] **Step 3: Добавить GitHub Secrets**

В репо → Settings → Secrets and variables → Actions → New repository secret:
- `KEYSTORE_BASE64` = содержимое `keystore.b64`
- `KEYSTORE_PASSWORD` = пароль хранилища
- `KEY_ALIAS` = `samsung-remote`
- `KEY_PASSWORD` = пароль ключа

Удалить локальные файлы:
```bash
rm keystore.b64
# release.keystore сохранить в безопасное место вне репо
```

- [ ] **Step 4: Обновить `app/build.gradle.kts` — добавить signingConfig**

Добавить внутри блока `android { }`:

```kotlin
    signingConfigs {
        create("release") {
            val keystoreFile = rootProject.file("release.keystore")
            if (keystoreFile.exists()) {
                storeFile = keystoreFile
                storePassword = System.getenv("KEYSTORE_PASSWORD")
                keyAlias = System.getenv("KEY_ALIAS")
                keyPassword = System.getenv("KEY_PASSWORD")
            }
        }
    }
```

И внутри `buildTypes.release`:

```kotlin
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("release")
        }
```

- [ ] **Step 5: Написать `release.yml`**

```yaml
name: Release APK

on:
  push:
    tags: [ 'v*.*.*' ]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Setup JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Decode keystore
        env:
          KEYSTORE_BASE64: ${{ secrets.KEYSTORE_BASE64 }}
        run: echo "$KEYSTORE_BASE64" | base64 -d > release.keystore

      - name: Build release APK
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: ./gradlew assembleRelease --no-daemon

      - name: Rename APK
        run: |
          mkdir -p release
          cp app/build/outputs/apk/release/app-release.apk \
             release/samsung-remote-${GITHUB_REF_NAME}.apk

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: release/samsung-remote-*.apk
          generate_release_notes: true

      - name: Clean keystore
        if: always()
        run: rm -f release.keystore
```

- [ ] **Step 6: Commit и пуш**

```bash
git add .github/workflows/release.yml app/build.gradle.kts
git commit -m "ci: release workflow with signed APK on version tag"
git push
```

Не тегируем пока — делаем первый релиз в Task 17 после README.

---

### Task 17: README + LICENSE + первый релиз + ручное тестирование

**Files:**
- Create: `README.md`
- Create: `LICENSE`

- [ ] **Step 1: Написать `LICENSE` (MIT)**

```
MIT License

Copyright (c) 2026 Maxim Leonidov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Написать `README.md`**

```markdown
# Samsung TV Remote

Android-пульт для старых Samsung Smart TV (H-серия 2014–2015, Orsay OS) по сетевому протоколу порта 55000.

Написан потому, что мой оригинальный Smart Touch Remote умер, а в Play Market все альтернативы платные. Параллельно — кейс для канала [@my_way_in_wibecoding](https://t.me/my_way_in_wibecoding).

## Поддерживаемые модели

Проверено на: **Samsung UE40H6410AU** (2015).
Должно работать на других Samsung H-серии 2014–2015 с сетевым управлением.

## Установка

1. Открой [Releases](https://github.com/maxxleon84-png/samsung-tv-remote/releases)
2. Скачай последний `samsung-remote-vX.X.X.apk` на телефон
3. Один раз разреши установку из неизвестных источников для своего браузера
4. Тап по APK → «Установить»

## Первый запуск

1. Введи IP телевизора (Меню → Сеть → Состояние сети → IP-адрес)
2. Нажми «Подключить»
3. На ТВ всплывёт запрос «Разрешить подключение?» — нажми **Разрешить** штатным пультом или кнопками на корпусе ТВ
4. Готово, можно управлять

## Что умеет

- Power, Source, Mute
- Громкость ±, каналы ±
- D-pad (стрелки + OK)
- Back, Home, Exit
- Цифры 0–9

## Что не умеет

- Эмуляцию тачпада Smart Touch Remote (невозможно в принципе — ТВ слушает только дискретные команды)
- Авто-поиск ТВ в сети (в планах на v1.1)
- Управление несколькими телевизорами
- Работу вне локальной Wi-Fi

## Стек

Kotlin · Jetpack Compose Material3 · AndroidX DataStore · no третьих зависимостей. minSdk 26, targetSdk 34.

## Разработка

```bash
git clone https://github.com/maxxleon84-png/samsung-tv-remote
cd samsung-tv-remote
./gradlew test         # unit-тесты протокола и ViewModel
./gradlew assembleDebug # debug APK
```

CI собирает debug APK на каждый push, релизный APK — на тег `v*.*.*`.

## Лицензия

MIT — см. [LICENSE](LICENSE).
```

- [ ] **Step 3: Commit README и LICENSE**

```bash
git add README.md LICENSE
git commit -m "docs: README and MIT license"
git push
```

- [ ] **Step 4: Создать первый релиз**

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions запустит `release.yml`, соберёт подписанный APK, создаст Release со ссылкой на скачивание.

- [ ] **Step 5: Установить APK на Realme 12 Pro+ и пройти ручную проверку**

Чек-лист ручного тестирования:

- [ ] APK ставится без ошибок
- [ ] Приложение открывает SetupScreen при первом запуске
- [ ] Ввод IP валидируется inline
- [ ] «Подключить» → на ТВ появляется запрос на пару́
- [ ] После подтверждения на ТВ → приложение переходит на RemoteScreen
- [ ] Power гасит/будит ТВ
- [ ] Громкость ▲▼ и Mute работают
- [ ] Каналы ▲▼ работают
- [ ] D-pad двигает курсор в меню, OK подтверждает
- [ ] Back / Home / Exit работают
- [ ] Source переключает вход
- [ ] Цифры 0–9 набирают канал
- [ ] После перезапуска приложения → автоподключение, сразу RemoteScreen
- [ ] Сменить IP в настройках → сбрасывает и возвращает на SetupScreen
- [ ] Если ТВ выключен из розетки → индикатор красный, тост с ошибкой, retry работает после включения

- [ ] **Step 6: Если ручная проверка провалилась**

Если ТВ молчит — на 99% формат auth-пакета немного отличается. План починки:
1. Установить Wireshark на компьютер
2. Поставить любое рабочее open-source приложение-пульт (например, samsung-tv-remote-app на GitHub от сообщества)
3. Снифнуть его первый обмен с ТВ
4. Сравнить с нашим пакетом побайтно, найти отличие, поправить `SamsungPacketEncoder.authPacket`, добавить тест на новый формат
5. Пересобрать, протестировать

Если это происходит — создаём беадовскую багу `fix(protocol): adjust auth packet for real H-series` и фиксим по TDD.

- [ ] **Step 7: Финальный коммит (обновить MEMORY и вернуться в my-vibecoding)**

После успешного теста — в репо my-vibecoding обновить MEMORY с ссылкой на новый проект:

```bash
cd c:/Users/DEXP/Documents/Projects/my-vibecoding
bd remember "samsung-tv-remote: Android Kotlin пульт для UE40H6410AU (H-серия). Репо https://github.com/maxxleon84-png/samsung-tv-remote, v1.0.0 выпущен, ручная проверка пройдена."
git push
```

---

## Done When

- [ ] Все 17 задач закрыты
- [ ] `./gradlew test` — зелёные unit-тесты
- [ ] GitHub Actions — зелёный debug на main, зелёный release на теге v1.0.0
- [ ] APK v1.0.0 установлен на Realme
- [ ] Все пункты чек-листа ручного тестирования пройдены
- [ ] Пост в @my_way_in_wibecoding с итогом и ссылкой на репо

---

## Self-Review Notes

- **Spec coverage:** все 14 разделов дизайна покрыты задачами: протокол (Tasks 6–8), UI (11–13), навигация (14), CI (15–16), тесты (5, 6, 7, 10), документация (17), риск-план (Task 17 Step 6 — Wireshark fallback).
- **No placeholders:** везде полный код или точная команда. Единственное намеренное «уточним по факту» — `phoneIp` и `phoneMac` в MainActivity захардкожены. Это осознанное v1.0-допущение: для протокола ТВ не проверяет корректность этих полей, реальный автодетект добавим в v1.1, о чём есть комментарий в коде.
- **Types consistent:** `SamsungLegacyClient.PORT`, `ConnectionState.Connected`, `KeyCode.OK`, `RemoteController.sendKey` — единое именование между задачами.
- **Side effects isolated:** `Transport` абстрагирует сокет → unit-тесты без сети; `IpStorage` инкапсулирует DataStore → MainActivity не трогает ключи напрямую.
