
// ==UserScript==
// @name         b站加速
// @namespace    http://www.bilibili.com/*
// @version      2025-04-18
// @description  try to take over the world!
// @author       You
// @match        https://www.bilibili.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/vue@3.2.37/dist/vue.global.min.js
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// ==/UserScript==

(function () {
    'use strict';

    // 添加样式
    GM_addStyle(`.speed-indicator {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 9999;
        font-size: 16px;
        transition: opacity 0.3s;
    }`);

    // 等待视频元素加载
    function waitForVideo() {
        return new Promise(resolve => {
            const checkVideo = () => {
                const video = document.querySelector('.bpx-player-video video') ||
                    document.querySelector('.bilibili-player-video video') ||
                    document.querySelector('video');
                if (video) {
                    resolve(video);
                } else {
                    setTimeout(checkVideo, 500);
                }
            };
            checkVideo();
        });
    }

    // 修改B站原生倍速控制菜单
    function modifySpeedMenu(video, updateCurrentSpeed, showSpeedIndicator) {
        // 创建MutationObserver监听DOM变化
        const observer = new MutationObserver((mutations) => {
            // 查找倍速控制菜单
            const speedMenu = document.querySelector('.bpx-player-ctrl-playbackrate-menu') ||
                document.querySelector('.bilibili-player-video-btn-speed-menu');

            if (speedMenu && !speedMenu.getAttribute('data-modified')) {
                // 查找菜单项
                const speedItems = speedMenu.querySelectorAll('.bpx-player-ctrl-playbackrate-menu-item, .bilibili-player-video-btn-speed-menu-list-item');

                if (speedItems.length > 0) {
                    const lastItem = speedItems[speedItems.length - 1];
                    const parent = lastItem.parentNode;

                    // 创建3.0倍速选项
                    const speed3 = lastItem.cloneNode(true);
                    speed3.textContent = '3.0x';
                    speed3.setAttribute('data-value', '3');

                    // 创建4.0倍速选项
                    const speed4 = lastItem.cloneNode(true);
                    speed4.textContent = '4.0x';
                    speed4.setAttribute('data-value', '4');

                    // 添加到菜单
                    parent.appendChild(speed3);
                    parent.appendChild(speed4);

                    // 为新选项添加点击事件
                    speed3.addEventListener('click', () => {
                        video.playbackRate = 3.0;
                        updateCurrentSpeed(3.0); // 使用回调函数更新外部的currentSpeed
                        showSpeedIndicator();
                    });

                    speed4.addEventListener('click', () => {
                        video.playbackRate = 4.0;
                        updateCurrentSpeed(4.0); // 使用回调函数更新外部的currentSpeed
                        showSpeedIndicator();
                    });

                    // 标记为已修改
                    speedMenu.setAttribute('data-modified', 'true');

                    console.log('B站倍速菜单已修改，添加了3.0x和4.0x选项');
                }
            }
        });

        // 开始观察DOM变化
        observer.observe(document.body, { childList: true, subtree: true });

        // 添加点击事件监听，当用户点击倍速按钮时触发观察
        document.addEventListener('click', (e) => {
            const speedBtn = e.target.closest('.bpx-player-ctrl-playbackrate') ||
                e.target.closest('.bilibili-player-video-btn-speed');
            if (speedBtn) {
                // 立即检查一次
                const speedMenu = document.querySelector('.bpx-player-ctrl-playbackrate-menu') ||
                    document.querySelector('.bilibili-player-video-btn-speed-menu');
                if (speedMenu && !speedMenu.getAttribute('data-modified')) {
                    observer.disconnect();
                    modifySpeedMenu(video, currentSpeed, showSpeedIndicator);
                }
            }
        });
    }

    // 主函数
    async function init() {
        // 等待视频元素加载
        const video = await waitForVideo();

        // 创建速度指示器
        const speedIndicator = document.createElement('div');
        speedIndicator.className = 'speed-indicator';
        speedIndicator.style.display = 'none';
        speedIndicator.textContent = '播放速度: 1.0x';
        document.body.appendChild(speedIndicator);

        // 获取当前视频的实际播放速度
        let currentSpeed = video.playbackRate || 1.0;
        let hideTimer = null;

        // 更新当前速度的函数
        function updateCurrentSpeed(speed) {
            currentSpeed = speed;
        }

        // 显示速度指示器
        function showSpeedIndicator() {
            // 获取实际播放速度
            currentSpeed = video.playbackRate;
            speedIndicator.textContent = `播放速度: ${currentSpeed.toFixed(2)}x`;
            speedIndicator.style.display = 'block';

            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(() => {
                speedIndicator.style.display = 'none';
            }, 2000);
        }

        // 设置初始速度
        video.playbackRate = currentSpeed;
        
        // 监听播放速度变化
        video.addEventListener('ratechange', () => {
            currentSpeed = video.playbackRate;
            showSpeedIndicator();
        });

        // 监听播放事件
        video.addEventListener('play', () => {
            // 获取当前实际播放速度
            currentSpeed = video.playbackRate;
            video.playbackRate = currentSpeed;
        });

        // 修改B站原生倍速菜单，传入更新速度的回调函数
        modifySpeedMenu(video, updateCurrentSpeed, showSpeedIndicator);

        // 监听键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === '-' && currentSpeed > 0.25) {
                currentSpeed -= 0.25;
                video.playbackRate = currentSpeed;
                showSpeedIndicator();
            }
            if (e.key === '=' && currentSpeed < 16) {
                currentSpeed += 0.25;
                video.playbackRate = currentSpeed;
                showSpeedIndicator();
            }
        });

        // 点击指示器显示使用说明
        speedIndicator.addEventListener('click', () => {
            Swal.fire({
                title: '使用说明',
                html: `
                <div>
                    <p>按"-"键减速，按"+"键加速</p>
                    <p>当前播放速度：${currentSpeed.toFixed(2)}x</p>
                    <p>已添加3.0x和4.0x到B站原生倍速菜单</p>
                </div>
                `,
                showConfirmButton: true
            });
        });
    }

    // 页面加载完成后初始化
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})();