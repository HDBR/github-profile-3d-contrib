import * as d3 from 'd3';
import { JSDOM } from 'jsdom';
import * as contrib from './create-3d-contrib';
// pie chart removed — not useful with mostly private repos
import * as radar from './create-radar-contrib';
import * as colors from './create-css-colors';
import * as util from './utils';
import * as type from './type';

const width = 1280;
const height = 850;

const radarWidth = 400 * 1.3;
const radarHeight = (radarWidth * 3) / 4;
const radarX = width - radarWidth - 40;

export const createSvg = (
    userInfo: type.UserInfo,
    settings: type.Settings,
    isForcedAnimation: boolean,
): string => {
    let svgWidth = width;
    let svgHeight = height;
    if (settings.type === 'radar_contrib_only') {
        svgWidth = radarWidth;
        svgHeight = radarHeight;
    }

    const fakeDom = new JSDOM(
        '<!DOCTYPE html><html><body><div class="container"></div></body></html>',
    );
    const container = d3.select(fakeDom.window.document).select('.container');
    const svg = container
        .append('svg')
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

    svg.append('style').html(
        [
            '* { font-family: "Ubuntu", "Helvetica", "Arial", sans-serif; }',
            colors.createCssColors(settings),
        ].join('\n'),
    );

    contrib.addDefines(svg, settings);

    // background
    svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .attr('class', 'fill-bg');

    if (settings.type === 'radar_contrib_only') {
        // radar chart only
        radar.createRadarContrib(
            svg,
            userInfo,
            0,
            0,
            radarWidth,
            radarHeight,
            settings,
            isForcedAnimation,
        );
    } else {
        // 3D-Contrib Calendar
        contrib.create3DContrib(
            svg,
            userInfo,
            0,
            0,
            width,
            height,
            settings,
            isForcedAnimation,
        );

        // radar chart
        radar.createRadarContrib(
            svg,
            userInfo,
            radarX,
            70,
            radarWidth,
            radarHeight,
            settings,
            isForcedAnimation,
        );

        const group = svg.append('g');

        // --- Stats panel (bottom-left) ---
        const panelX = 25;
        const panelY = height - 310;
        const barMaxWidth = 160;
        const barHeight = 10;
        const rowHeight = 44;

        const stats = [
            { label: 'Commits', value: userInfo.totalCommitContributions, icon: 'M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z' },
            { label: 'Pull Requests', value: userInfo.totalPullRequestContributions, icon: 'M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z' },
            { label: 'Code Reviews', value: userInfo.totalPullRequestReviewContributions, icon: 'M1.5 2.75a.25.25 0 01.25-.25h12.5a.25.25 0 01.25.25v8.5a.25.25 0 01-.25.25h-6.5a.75.75 0 00-.53.22L4.5 14.44v-2.19a.75.75 0 00-.75-.75h-2a.25.25 0 01-.25-.25v-8.5zM1.75 1A1.75 1.75 0 000 2.75v8.5C0 12.216.784 13 1.75 13H3v1.543a1.457 1.457 0 002.487 1.03L8.061 13h6.189A1.75 1.75 0 0016 11.25v-8.5A1.75 1.75 0 0014.25 1H1.75z' },
            { label: 'Issues', value: userInfo.totalIssueContributions, icon: 'M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z' },
            { label: 'Repositories', value: userInfo.totalRepositoryContributions, icon: 'M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1h-8a1 1 0 00-1 1v6.708A2.486 2.486 0 014.5 9h8.5V1.5zm-8 11h1.173a.75.75 0 010 1.5H4.5a1 1 0 010-2z' },
        ];

        const total = userInfo.totalContributions;
        const maxVal = Math.max(...stats.map((s) => s.value), 1);

        const statsGroup = group.append('g')
            .attr('transform', `translate(${panelX}, ${panelY})`);

        // --- Ring gauge for total contributions ---
        const ringCx = 60;
        const ringCy = 55;
        const ringR = 48;
        const ringStroke = 8;

        // Ring background
        statsGroup.append('circle')
            .attr('cx', ringCx)
            .attr('cy', ringCy)
            .attr('r', ringR)
            .attr('fill', 'none')
            .attr('stroke-width', ringStroke)
            .attr('stroke-opacity', 0.15)
            .attr('class', 'stroke-fg');

        // Ring arc (animated)
        const circumference = 2 * Math.PI * ringR;
        const ringArc = statsGroup.append('circle')
            .attr('cx', ringCx)
            .attr('cy', ringCy)
            .attr('r', ringR)
            .attr('fill', 'none')
            .attr('stroke-width', ringStroke)
            .attr('stroke-linecap', 'round')
            .attr('stroke-dasharray', `${circumference * 0.75} ${circumference * 0.25}`)
            .attr('transform', `rotate(-90, ${ringCx}, ${ringCy})`)
            .attr('class', 'radar');

        if (isForcedAnimation) {
            ringArc
                .attr('stroke-dasharray', `0 ${circumference}`)
                .append('animate')
                .attr('attributeName', 'stroke-dasharray')
                .attr('from', `0 ${circumference}`)
                .attr('to', `${circumference * 0.75} ${circumference * 0.25}`)
                .attr('dur', '1.5s')
                .attr('fill', 'freeze')
                .attr('begin', '0.2s');
        }

        // Total number in center
        statsGroup
            .append('text')
            .style('font-size', '22px')
            .style('font-weight', 'bold')
            .attr('x', ringCx)
            .attr('y', ringCy - 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .text(util.inertThousandSeparator(total))
            .attr('class', 'fill-strong');

        const contribLabel = settings.l10n
            ? settings.l10n.contrib
            : 'contributions';
        statsGroup
            .append('text')
            .style('font-size', '10px')
            .attr('x', ringCx)
            .attr('y', ringCy + 18)
            .attr('text-anchor', 'middle')
            .text(contribLabel)
            .attr('class', 'fill-weak');

        // --- Metric rows with icons and bars ---
        const metricsGroup = statsGroup.append('g')
            .attr('transform', `translate(0, 120)`);

        stats.forEach((stat, i) => {
            const y = i * rowHeight;
            const barW = Math.max((stat.value / maxVal) * barMaxWidth, 4);
            const pct = total > 0 ? Math.round((stat.value / total) * 100) : 0;

            const row = metricsGroup.append('g')
                .attr('transform', `translate(0, ${y})`);

            // icon
            row.append('g')
                .attr('transform', 'scale(0.9)')
                .append('path')
                .attr('d', stat.icon)
                .attr('fill-rule', 'evenodd')
                .attr('class', 'fill-fg');

            // label + value
            row.append('text')
                .style('font-size', '12px')
                .attr('x', 20)
                .attr('y', 0)
                .text(stat.label)
                .attr('class', 'fill-fg');

            row.append('text')
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .attr('x', barMaxWidth + 40)
                .attr('y', 0)
                .attr('text-anchor', 'end')
                .text(`${util.inertThousandSeparator(stat.value)}`)
                .attr('class', 'fill-fg');

            // bar background
            row.append('rect')
                .attr('x', 20)
                .attr('y', 6)
                .attr('width', barMaxWidth)
                .attr('height', barHeight)
                .attr('rx', barHeight / 2)
                .attr('fill-opacity', 0.12)
                .attr('class', 'fill-fg');

            // bar fill
            const bar = row.append('rect')
                .attr('x', 20)
                .attr('y', 6)
                .attr('height', barHeight)
                .attr('rx', barHeight / 2)
                .attr('class', 'radar');

            if (isForcedAnimation) {
                bar.attr('width', 0);
                bar.append('animate')
                    .attr('attributeName', 'width')
                    .attr('from', '0')
                    .attr('to', String(barW))
                    .attr('dur', '1.2s')
                    .attr('fill', 'freeze')
                    .attr('begin', `${0.4 + i * 0.12}s`);
            } else {
                bar.attr('width', barW);
            }

            // percentage
            row.append('text')
                .style('font-size', '11px')
                .attr('x', barMaxWidth + 44)
                .attr('y', 16)
                .text(`${pct}%`)
                .attr('class', 'fill-weak');
        });

        // --- Date range (top-right) ---
        const startDate = userInfo.contributionCalendar[0].date;
        const endDate =
            userInfo.contributionCalendar[
                userInfo.contributionCalendar.length - 1
            ].date;
        const period = `${util.toIsoDate(startDate)} / ${util.toIsoDate(
            endDate,
        )}`;

        group
            .append('text')
            .style('font-size', '16px')
            .attr('x', width - 20)
            .attr('y', 20)
            .attr('dominant-baseline', 'hanging')
            .attr('text-anchor', 'end')
            .text(period)
            .attr('class', 'fill-weak');
    }
    return container.html();
};
