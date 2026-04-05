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

        // --- Stats panel (bottom-left, where pie chart used to be) ---
        const panelX = 30;
        const panelY = height - 280;
        const barMaxWidth = 180;
        const barHeight = 14;
        const barGap = 32;

        const stats = [
            { label: 'Commits', value: userInfo.totalCommitContributions },
            { label: 'Pull Requests', value: userInfo.totalPullRequestContributions },
            { label: 'Reviews', value: userInfo.totalPullRequestReviewContributions },
            { label: 'Issues', value: userInfo.totalIssueContributions },
            { label: 'Repos', value: userInfo.totalRepositoryContributions },
        ];

        const maxVal = Math.max(...stats.map((s) => s.value), 1);

        const statsGroup = group.append('g')
            .attr('transform', `translate(${panelX}, ${panelY})`);

        // Total contributions — big number
        statsGroup
            .append('text')
            .style('font-size', '36px')
            .style('font-weight', 'bold')
            .attr('x', 0)
            .attr('y', 0)
            .text(util.inertThousandSeparator(userInfo.totalContributions))
            .attr('class', 'fill-strong');

        const contribLabel = settings.l10n
            ? settings.l10n.contrib
            : 'contributions';
        statsGroup
            .append('text')
            .style('font-size', '16px')
            .attr('x', 0)
            .attr('y', 22)
            .text(contribLabel)
            .attr('class', 'fill-weak');

        // Horizontal bars
        stats.forEach((stat, i) => {
            const y = 50 + i * barGap;
            const barW = Math.max((stat.value / maxVal) * barMaxWidth, 4);

            // label
            statsGroup
                .append('text')
                .style('font-size', '13px')
                .attr('x', 0)
                .attr('y', y)
                .text(stat.label)
                .attr('class', 'fill-fg');

            // bar background
            statsGroup
                .append('rect')
                .attr('x', 0)
                .attr('y', y + 5)
                .attr('width', barMaxWidth)
                .attr('height', barHeight)
                .attr('rx', 3)
                .attr('fill-opacity', 0.15)
                .attr('class', 'fill-fg');

            // bar fill
            const bar = statsGroup
                .append('rect')
                .attr('x', 0)
                .attr('y', y + 5)
                .attr('height', barHeight)
                .attr('rx', 3)
                .attr('class', 'radar');

            if (isForcedAnimation) {
                bar.attr('width', 0);
                bar
                    .append('animate')
                    .attr('attributeName', 'width')
                    .attr('from', '0')
                    .attr('to', String(barW))
                    .attr('dur', '1.5s')
                    .attr('fill', 'freeze')
                    .attr('begin', `${0.3 + i * 0.15}s`);
            } else {
                bar.attr('width', barW);
            }

            // value
            statsGroup
                .append('text')
                .style('font-size', '13px')
                .style('font-weight', 'bold')
                .attr('x', barMaxWidth + 8)
                .attr('y', y + 17)
                .text(util.inertThousandSeparator(stat.value))
                .attr('class', 'fill-fg');
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
