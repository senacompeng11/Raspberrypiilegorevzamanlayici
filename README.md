## Dağıtık IoT Görev Zamanlayıcı (Raspberry Pi Tabanlı)

Raspberry Pi tabanlı IoT görev zamanlama sistemi; işletim sistemi zamanlama kavramlarını gerçek donanım üzerinde görselleştirmek ve simüle etmek için geliştirilmiştir.

## Proje Özeti

Bu proje, işletim sistemlerinde görev zamanlamasının nasıl çalıştığını IoT cihazları, gerçek zamanlı iletişim ve web tabanlı bir izleme paneli ile birleştirerek göstermektedir.

ESP8266 cihazları, gerçek dünya sensör verilerine bağlı olarak görevler üretir ve bu görevleri WiFi üzerinden Raspberry Pi’ye gönderir. Raspberry Pi, bir zamanlayıcı (scheduler) görevi görerek gelen görevleri FIFO (First In First Out) kuyruğuna yerleştirir ve geliş sırasına göre çalıştırır. Gerçek zamanlı bir dashboard üzerinden görev oluşturma, kuyruk durumu, yürütme sırası ve sistem aktiviteleri izlenebilir.

Projenin amacı; görev kuyrukları, zamanlama algoritmaları ve kaynak yönetimi gibi teorik kavramları fiziksel donanım üzerinde çalışan görsel ve etkileşimli bir sisteme dönüştürmektir.

## Özellikler

* FIFO tabanlı görev zamanlama
* Raspberry Pi üzerinde scheduler implementasyonu
* ESP8266 sensör entegrasyonu
* Gerçek zamanlı görev izleme paneli
* FastAPI backend servisleri
* HTTP tabanlı cihaz iletişimi
* Çoklu cihazdan görev üretimi
* Gerçek zamanlı kuyruk görselleştirme

## Sistem Mimarisi

ESP8266 Sensörler → FastAPI Backend → FIFO Kuyruğu → Raspberry Pi Scheduler → Görev Çalıştırma → Web Dashboard

## Kullanılan Teknolojiler

* Raspberry Pi
* ESP8266
* Python
* FastAPI
* HTML
* CSS
* JavaScript
* HTTP REST API
* FIFO Zamanlama Algoritması

## Katkılarım

* Web dashboard arayüzünü tasarladım ve geliştirdim
* Raspberry Pi scheduler mimarisine katkı sağladım
* FIFO zamanlama algoritmasının uygulanmasına destek oldum
* Sistem entegrasyonu ve test süreçlerinde yer aldım
* Gerçek zamanlı izleme bileşenlerini geliştirdim

Bu proje, Bilgisayar Organizasyonu dersi kapsamında geliştirilmiş olup gömülü sistemler, IoT mimarileri, zamanlama algoritmaları, ağ iletişimi ve full-stack geliştirme konularında uygulamalı deneyim kazandırmıştır.
